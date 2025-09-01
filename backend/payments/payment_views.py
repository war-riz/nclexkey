# payments/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.utils import timezone
from django.conf import settings
from .models import Payment, PaymentRefund, PaymentGateway
from .serializers import PaymentSerializer
from .services import PaymentServiceFactory
from courses.models import Course, CourseEnrollment
from users.models import User
import logging
import uuid

logger = logging.getLogger(__name__)

# Create your views here.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_history(request):
    """
    Get user's payment history - STUDENTS ONLY
    GET /api/payments/transactions/
    """
    if request.user.role != 'user':
        return Response({'detail': 'Student access required'}, status=403)
    
    try:
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        status_filter = request.GET.get('status', '')
        
        payments = Payment.objects.filter(user=request.user).select_related('course')
        
        if status_filter:
            payments = payments.filter(status=status_filter)
        
        payments = payments.order_by('-created_at')
        
        paginator = Paginator(payments, per_page)
        page_obj = paginator.get_page(page)
        
        serializer = PaymentSerializer(page_obj.object_list, many=True)
        
        return Response({
            'payments': serializer.data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_payments': paginator.count,
                'per_page': per_page,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
        
    except Exception as e:
        logger.error(f"Payment history error: {str(e)}")
        return Response({'detail': 'Failed to fetch payment history'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_detail(request, payment_id):
    """
    Get payment details - STUDENTS can view their own, SUPER_ADMIN can view all
    GET /api/payments/transactions/{payment_id}/
    """
    try:
        if request.user.role == 'user':
            # Students can only view their own payments
            payment = Payment.objects.select_related('course').get(
                id=payment_id,
                user=request.user
            )
        elif request.user.role == 'super_admin':
            # Platform managers can view any payment
            payment = Payment.objects.select_related('course', 'user').get(id=payment_id)
        else:
            return Response({'detail': 'Access denied'}, status=403)
        
        serializer = PaymentSerializer(payment)
        
        return Response({
            'payment': serializer.data
        })
        
    except Payment.DoesNotExist:
        return Response({'detail': 'Payment not found'}, status=404)
    except Exception as e:
        logger.error(f"Payment detail error: {str(e)}")
        return Response({'detail': 'Failed to fetch payment details'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_payment_overview(request):
    """
    Platform manager payment overview - SUPER_ADMIN ONLY
    GET /api/payments/admin/overview/
    """
    if request.user.role != 'super_admin':
        return Response({'detail': 'Platform manager access required'}, status=403)
    
    try:
        from django.db.models import Count, Sum
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        # Get overview stats
        today = timezone.now().date()
        last_30_days = today - timedelta(days=30)
        
        stats = {
            'total_payments': Payment.objects.count(),
            'completed_payments': Payment.objects.filter(status='completed').count(),
            'failed_payments': Payment.objects.filter(status='failed').count(),
            'pending_payments': Payment.objects.filter(status='pending').count(),
            'total_revenue': Payment.objects.filter(status='completed').aggregate(
                total=Sum('amount')
            )['total'] or 0,
            'last_30_days_revenue': Payment.objects.filter(
                status='completed',
                paid_at__date__gte=last_30_days
            ).aggregate(total=Sum('amount'))['total'] or 0,
            'pending_refunds': PaymentRefund.objects.filter(
                status__in=['pending', 'pending_review']
            ).count()
        }
        
        # Recent payments
        recent_payments = Payment.objects.select_related(
            'user', 'course'
        ).order_by('-created_at')[:10]
        
        return Response({
            'stats': stats,
            'recent_payments': PaymentSerializer(recent_payments, many=True).data
        })
        
    except Exception as e:
        logger.error(f"Admin payment overview error: {str(e)}")
        return Response({'detail': 'Failed to fetch payment overview'}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_payment(request):
    """
    Initialize payment for course enrollment or student registration
    POST /api/payments/initialize/
    """
    try:
        gateway_name = request.data.get('gateway', 'paystack')
        payment_type = request.data.get('payment_type', 'course_enrollment')
        course_id = request.data.get('course_id')
        amount = request.data.get('amount')
        currency = request.data.get('currency', 'NGN')
        
        # Validate payment type
        if payment_type not in ['course_enrollment', 'student_registration']:
            return Response(
                {'detail': 'Invalid payment type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle course enrollment
        if payment_type == 'course_enrollment':
            if not course_id:
                return Response(
                    {'detail': 'Course ID is required for course enrollment'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                course = Course.objects.get(id=course_id)
                amount = amount or course.price
                currency = currency or course.currency
            except Course.DoesNotExist:
                return Response(
                    {'detail': 'Course not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Handle student registration
        elif payment_type == 'student_registration':
            amount = amount or 5000  # Default registration fee
            currency = currency or 'NGN'
            course_id = 'student-registration'  # Special course ID for registration
        
        # Get or create payment gateway
        try:
            gateway = PaymentGateway.objects.get(name=gateway_name, is_active=True)
        except PaymentGateway.DoesNotExist:
            return Response(
                {'detail': f'Payment gateway {gateway_name} not available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            course_id=course_id if payment_type == 'course_enrollment' else None,
            amount=amount,
            currency=currency,
            gateway=gateway,
            reference=f"PAY-{uuid.uuid4().hex[:8].upper()}",
            status='pending',
            payment_method=payment_type
        )
        
        # Initialize payment with gateway
        try:
            payment_service = PaymentServiceFactory.get_service(gateway_name)
            callback_url = f"{settings.FRONTEND_URL}/payment-status/{payment.reference}/"
            
            payment_result = payment_service.initialize_payment(payment, callback_url)
            
            if payment_result['success']:
                return Response({
                    'success': True,
                    'data': {
                        'payment_url': payment_result['payment_url'],
                        'reference': payment.reference,
                        'amount': float(amount),
                        'currency': currency,
                        'gateway': gateway_name
                    }
                }, status=status.HTTP_200_OK)
            else:
                payment.status = 'failed'
                payment.gateway_response = payment_result
                payment.save()
                return Response({
                    'success': False,
                    'error': {
                        'message': payment_result.get('message', 'Payment initialization failed')
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Payment initialization error: {str(e)}")
            payment.status = 'failed'
            payment.save()
            return Response({
                'success': False,
                'error': {
                    'message': 'Payment service temporarily unavailable'
                }
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
    except Exception as e:
        logger.error(f"Payment initialization error: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'message': 'Failed to initialize payment'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request, reference):
    """
    Verify payment status
    POST /api/payments/verify/{reference}/
    """
    try:
        payment = Payment.objects.get(reference=reference, user=request.user)
        
        # Verify payment with gateway
        try:
            payment_service = PaymentServiceFactory.get_service(payment.gateway.name)
            verification_result = payment_service.verify_payment(reference)
            
            if verification_result['success']:
                # Update payment status
                payment.status = 'completed'
                payment.paid_at = timezone.now()
                payment.gateway_response = verification_result
                payment.save()
                
                # Handle course enrollment if applicable
                if payment.payment_method == 'course_enrollment' and payment.course:
                    enrollment, created = CourseEnrollment.objects.get_or_create(
                        user=request.user,
                        course=payment.course,
                        defaults={
                            'payment_status': 'completed',
                            'payment_method': payment.gateway.name,
                            'payment_id': payment.reference,
                            'amount_paid': payment.amount,
                            'currency': payment.currency
                        }
                    )
                    if not created:
                        enrollment.payment_status = 'completed'
                        enrollment.save()
                
                return Response({
                    'success': True,
                    'data': {
                        'payment': PaymentSerializer(payment).data,
                        'message': 'Payment verified successfully'
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': {
                        'message': verification_result.get('message', 'Payment verification failed')
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Payment verification error: {str(e)}")
            return Response({
                'success': False,
                'error': {
                    'message': 'Payment verification failed'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Payment.DoesNotExist:
        return Response({
            'success': False,
            'error': {
                'message': 'Payment not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'message': 'Failed to verify payment'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment_gateways(request):
    """
    Get available payment gateways
    GET /api/payments/gateways/
    """
    try:
        gateways = PaymentGateway.objects.filter(is_active=True)
        gateway_data = []
        
        for gateway in gateways:
            gateway_data.append({
                'name': gateway.name,
                'display_name': gateway.display_name,
                'is_default': gateway.is_default,
                'supported_currencies': gateway.supported_currencies
            })
        
        return Response({
            'success': True,
            'data': {
                'gateways': gateway_data
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get payment gateways error: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'message': 'Failed to get payment gateways'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def test_student_registration(request):
    """
    Test endpoint for student registration payment
    POST /api/payments/test-student-registration/
    """
    try:
        amount = request.data.get('amount', 5000)
        currency = request.data.get('currency', 'NGN')
        
        # Generate a test reference
        test_reference = f"TEST-{uuid.uuid4().hex[:8].upper()}"
        
        # Create a test payment record
        try:
            gateway = PaymentGateway.objects.get(name='paystack', is_active=True)
        except PaymentGateway.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'message': 'Payment gateway not available'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create test payment
        payment = Payment.objects.create(
            user=None,  # No user for test
            course_id=None,  # No course for test
            amount=amount,
            currency=currency,
            gateway=gateway,
            reference=test_reference,
            status='completed',  # Mark as completed for test
            payment_method='test_student_registration'
        )
        
        return Response({
            'success': True,
            'data': {
                'reference': test_reference,
                'amount': float(amount),
                'currency': currency,
                'message': 'Test payment successful'
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Test student registration error: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'message': 'Test payment failed'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)