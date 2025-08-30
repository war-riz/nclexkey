# payments/bank_transfer.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import logging

from .models import Payment, PaymentGateway
from courses.models import Course, CourseEnrollment, UserCourseProgress
from .services import PaystackService

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_bank_transfer_payment(request, course_id):
    """
    Initiate bank transfer payment for course enrollment
    POST /api/courses/{course_id}/enroll/bank-transfer/
    """
    try:
        course = Course.objects.get(id=course_id, is_active=True)
        user = request.user
        
        # Check if already enrolled
        existing_enrollment = CourseEnrollment.objects.filter(
            user=user, 
            course=course,
            payment_status='completed'
        ).first()
        
        if existing_enrollment:
            return Response({
                'detail': 'You are already enrolled in this course.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if course is free
        if course.is_free():
            return Response({
                'detail': 'This course is free. Use regular enrollment endpoint.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        amount = course.get_effective_price()
        currency = course.currency or 'NGN'
        
        # Get Paystack gateway for bank transfer
        paystack_gateway = PaymentGateway.objects.filter(
            name='paystack', 
            is_active=True
        ).first()
        
        if not paystack_gateway:
            return Response({
                'detail': 'Payment gateway not available'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Create payment record
        with transaction.atomic():
            payment = Payment.objects.create(
                user=user,
                course=course,
                gateway=paystack_gateway,
                amount=amount,
                currency=currency,
                customer_email=user.email,
                customer_name=user.full_name,
                customer_phone=getattr(user, 'phone', ''),
                payment_method='bank_transfer',
                status='pending'
            )
            
            # Generate dedicated account number for this payment
            paystack_service = PaystackService()
            bank_account_result = paystack_service.create_dedicated_virtual_account(payment)
            
            if bank_account_result['success']:
                # Store bank details in payment
                payment.gateway_response = bank_account_result['data']
                payment.save()
                
                # Create pending enrollment
                enrollment = CourseEnrollment.objects.create(
                    user=user,
                    course=course,
                    payment_status='pending',
                    payment_method='bank_transfer',
                    payment_id=payment.reference,
                    amount_paid=amount,
                    currency=currency
                )
                
                bank_details = bank_account_result['data']
                
                return Response({
                    'message': 'Bank transfer details generated successfully',
                    'payment_reference': payment.reference,
                    'enrollment_id': str(enrollment.id),
                    'bank_details': {
                        'account_number': bank_details.get('account_number'),
                        'account_name': bank_details.get('account_name'),
                        'bank_name': bank_details.get('bank', {}).get('name'),
                        'bank_code': bank_details.get('bank', {}).get('code'),
                        'amount': float(amount),
                        'currency': currency,
                        'expires_at': (timezone.now() + timezone.timedelta(hours=24)).isoformat()
                    },
                    'instructions': [
                        f'Transfer exactly {currency} {amount:,.2f} to the account above',
                        'Use your full name as transfer description',
                        'Payment will be confirmed automatically within 5-10 minutes',
                        'This account expires in 24 hours'
                    ]
                })
            else:
                return Response({
                    'detail': bank_account_result.get('message', 'Failed to generate bank transfer details')
                }, status=status.HTTP_400_BAD_REQUEST)
        
    except Course.DoesNotExist:
        return Response({
            'detail': 'Course not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Bank transfer initiation error: {str(e)}")
        return Response({
            'detail': 'Failed to initiate bank transfer'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_bank_transfer_status(request, payment_reference):
    """
    Check status of bank transfer payment
    GET /api/payments/bank-transfer/{payment_reference}/status/
    """
    try:
        payment = Payment.objects.get(
            reference=payment_reference,
            user=request.user,
            payment_method='bank_transfer'
        )
        
        if payment.status == 'completed':
            return Response({
                'status': 'completed',
                'message': 'Payment confirmed! You now have access to the course.',
                'paid_at': payment.paid_at,
                'redirect_url': f'/dashboard/courses/{payment.course.id}'
            })
        elif payment.status == 'failed':
            return Response({
                'status': 'failed',
                'message': 'Payment failed. Please try again or contact support.',
                'failure_reason': payment.failure_reason
            })
        else:
            # Still pending - check with Paystack for updates
            paystack_service = PaystackService()
            verification_result = paystack_service.verify_payment(payment.reference)
            
            if verification_result['success'] and verification_result['verified']:
                if verification_result['status'] == 'success':
                    # Update payment and complete enrollment
                    complete_bank_transfer_payment(payment, verification_result)
                    
                    return Response({
                        'status': 'completed',
                        'message': 'Payment confirmed! You now have access to the course.',
                        'paid_at': payment.paid_at,
                        'redirect_url': f'/dashboard/courses/{payment.course.id}'
                    })
            
            # Still pending
            bank_details = payment.gateway_response or {}
            return Response({
                'status': 'pending',
                'message': 'Waiting for payment confirmation. Please ensure you have transferred the exact amount.',
                'bank_details': {
                    'account_number': bank_details.get('account_number'),
                    'account_name': bank_details.get('account_name'),
                    'bank_name': bank_details.get('bank', {}).get('name'),
                    'amount': float(payment.amount),
                    'currency': payment.currency
                },
                'expires_at': (payment.created_at + timezone.timedelta(hours=24)).isoformat()
            })
        
    except Payment.DoesNotExist:
        return Response({
            'detail': 'Payment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Bank transfer status check error: {str(e)}")
        return Response({
            'detail': 'Failed to check payment status'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def complete_bank_transfer_payment(payment, verification_data):
    """Complete bank transfer payment and enrollment"""
    try:
        with transaction.atomic():
            # Update payment
            payment.status = 'completed'
            payment.paid_at = timezone.now()
            payment.gateway_response.update(verification_data.get('data', {}))
            payment.save()
            
            # Update enrollment
            enrollment = CourseEnrollment.objects.get(payment_id=payment.reference)
            enrollment.payment_status = 'completed'
            enrollment.enrolled_at = timezone.now()
            enrollment.save()
            
            # Create progress record
            UserCourseProgress.objects.get_or_create(
                user=payment.user,
                course=payment.course,
                defaults={'progress_percentage': 0}
            )
            
            logger.info(f"Bank transfer completed: {payment.user.email} -> {payment.course.title}")
            
    except Exception as e:
        logger.error(f"Bank transfer completion error: {str(e)}")
        raise e