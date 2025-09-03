# payments/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.utils import timezone
from django.conf import settings
from .models import Payment, PaymentGateway
from .serializers import PaymentSerializer
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
    if request.user.role != 'student':
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
    Get payment details - STUDENTS can view their own, INSTRUCTORS can view all
    GET /api/payments/transactions/{payment_id}/
    """
    try:
        if request.user.role == 'user':
            # Students can only view their own payments
            payment = Payment.objects.select_related('course').get(
                id=payment_id,
                user=request.user
            )
        elif request.user.role == 'instructor':
            # Instructors can view any payment
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
    Instructor payment overview - INSTRUCTOR ONLY
    GET /api/payments/admin/overview/
    """
    if request.user.role != 'instructor':
        return Response({'detail': 'Instructor access required'}, status=403)
    
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
            'pending_refunds': 0 # Removed PaymentRefund.objects.filter(
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
@permission_classes([AllowAny])  # Allow unauthenticated access for registration
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
        
        # Get user data for student registration
        user_data = request.data.get('user_data', {})
        
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
        
        # Get or create payment gateway (create default if none exists)
        try:
            gateway = PaymentGateway.objects.get(name=gateway_name, is_active=True)
        except PaymentGateway.DoesNotExist:
            # Create default Paystack gateway if it doesn't exist
            gateway, created = PaymentGateway.objects.get_or_create(
                name='paystack',
                defaults={
                    'display_name': 'Paystack',
                    'is_active': True,
                    'config': {
                        'public_key': 'pk_test_...',  # Default test key
                        'secret_key': 'sk_test_...'
                    }
                }
            )
        
        # For student registration, we don't have a user yet, so create a temporary payment
        if payment_type == 'student_registration':
            # Create payment without user (will be linked later)
            payment = Payment.objects.create(
                user=None,  # No user yet
                course_id=None,  # No course for registration
                amount=amount,
                currency=currency,
                gateway=gateway,
                reference=f"REG-{uuid.uuid4().hex[:8].upper()}",
                status='pending',
                payment_method=payment_type,
                metadata={
                    'user_data': user_data,
                    'payment_type': payment_type
                }
            )
        else:
            # For course enrollment, user must be authenticated
            if not request.user.is_authenticated:
                return Response(
                    {'detail': 'Authentication required for course enrollment'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            payment = Payment.objects.create(
                user=request.user,
                course_id=course_id,
                amount=amount,
                currency=currency,
                gateway=gateway,
                reference=f"PAY-{uuid.uuid4().hex[:8].upper()}",
                status='pending',
                payment_method=payment_type
            )
        
        # Generate payment URL
        try:
            # For now, we'll return a test payment URL
            # In production, you would integrate with Paystack API
            callback_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/payment-status/{payment.reference}/"
            
            # Generate a test payment URL (in production, this would be Paystack's payment URL)
            if gateway_name == 'paystack':
                payment_url = f"https://checkout.paystack.com/{payment.reference}"
            else:
                payment_url = f"https://test-payment.com/{payment.reference}"
            
            return Response({
                'success': True,
                'data': {
                    'payment_url': payment_url,
                    'reference': payment.reference,
                    'amount': float(amount),
                    'currency': currency,
                    'gateway': gateway_name,
                    'callback_url': callback_url
                }
            }, status=status.HTTP_200_OK)
                
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
        
        # Simplified payment verification - mark as completed
        try:
            # For now, we'll mark the payment as completed
            # In production, you would verify with Paystack webhook
            payment.status = 'completed'
            payment.completed_at = timezone.now()
            payment.save()
            
            # Handle course enrollment if applicable
            if payment.course:
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
@permission_classes([AllowAny])
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
        
        # Generate a test payment reference
        reference = f"TEST-REG-{uuid.uuid4().hex[:8].upper()}"
        
        # Create a test payment record
        try:
            gateway = PaymentGateway.objects.get(name='paystack', is_active=True)
        except PaymentGateway.DoesNotExist:
            # Create default Paystack gateway if it doesn't exist
            gateway, created = PaymentGateway.objects.get_or_create(
                name='paystack',
                defaults={
                    'display_name': 'Paystack',
                    'is_active': True,
                    'config': {
                        'public_key': 'pk_test_...',
                        'secret_key': 'sk_test_...'
                    }
                }
            )
        
        # Create test payment
        payment = Payment.objects.create(
            user=None,
            course=None,
            amount=amount,
            currency=currency,
            gateway=gateway,
            reference=reference,
            status='completed',  # Mark as completed for testing
            payment_method='student_registration',
            metadata={
                'test': True,
                'user_data': request.data.get('user_data', {}),
                'payment_type': 'student_registration'
            }
        )
        
        return Response({
            'success': True,
            'reference': reference,
            'amount': float(amount),
            'currency': currency,
            'message': 'Test payment successful'
        })
        
    except Exception as e:
        logger.error(f"Test payment error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Test payment failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)