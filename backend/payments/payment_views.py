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
from django.http import HttpResponse

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
    Initialize payment for student registration ONLY
    POST /api/payments/initialize/
    """
    try:
        gateway_name = request.data.get('gateway', 'paystack')
        payment_type = request.data.get('payment_type', 'student_registration')
        amount = request.data.get('amount')
        currency = request.data.get('currency', 'NGN')
        
        # Get user data for student registration
        user_data = request.data.get('user_data', {})
        
        # Only allow student registration payments
        if payment_type != 'student_registration':
            return Response({
                'success': False,
                'error': {
                    'message': 'Only student registration payments are supported.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate required user data
        if not user_data.get('email') or not user_data.get('full_name'):
            return Response({
                'success': False,
                'error': {
                    'message': 'Email and full name are required for registration payment.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set fixed registration fee
        amount = 30000  # 30,000 NGN for full platform access
        currency = 'NGN'
        
        # Get or create payment gateway
        try:
            gateway = PaymentGateway.objects.get(name=gateway_name, is_active=True)
        except PaymentGateway.DoesNotExist:
            # Create default Paystack gateway if none exists
            gateway = PaymentGateway.objects.create(
                name='paystack',
                display_name='Paystack',
                is_active=True,
                is_default=True,
                public_key=getattr(settings, 'PAYSTACK_PUBLIC_KEY', ''),
                secret_key=getattr(settings, 'PAYSTACK_SECRET_KEY', ''),
                webhook_secret=getattr(settings, 'PAYSTACK_WEBHOOK_SECRET', ''),
                supported_currencies=['NGN', 'USD', 'GHS', 'KES'],
                transaction_fee_percentage=0.0150,  # 1.5%
                transaction_fee_cap=2000.00,  # 2000 NGN cap
                supports_transfers=True,
                minimum_transfer_amount=1000.00
            )
        
        # Create payment record for student registration
        payment = Payment.objects.create(
            user=None,  # Will be linked after user creation
            course_id=None,  # No specific course for registration
            amount=amount,
            currency=currency,
            gateway=gateway,
            reference=f"REG-{uuid.uuid4().hex[:8].upper()}",
            status='pending',
            payment_method=payment_type,
            customer_email=user_data.get('email', ''),
            customer_name=user_data.get('full_name', ''),
            customer_phone=user_data.get('phone_number', ''),
            metadata={
                'payment_type': payment_type,
                'user_data': user_data,
                'description': 'NCLEX Keys Platform Access - Full Course Access'
            }
        )
        
        # Generate payment URL using Paystack API
        try:
            import requests
            
            # Paystack API endpoint
            paystack_url = "https://api.paystack.co/transaction/initialize"
            
            # Prepare payload for Paystack
            payload = {
                "email": user_data.get('email', ''),
                "amount": int(amount * 100),  # Paystack expects amount in kobo (smallest currency unit)
                "currency": currency,
                "reference": payment.reference,
                "callback_url": f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/payment-status/{payment.reference}/",
                "metadata": {
                    "payment_id": str(payment.id),
                    "payment_type": payment_type,
                    "description": "NCLEX Keys Platform Access",
                    "user_data": user_data
                }
            }
            
            # Add payment method if specified
            payment_method = request.data.get('payment_method')
            if payment_method == 'bank_transfer':
                payload["channels"] = ["bank"]
            else:
                # Default channels for Paystack
                payload["channels"] = ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"]
            
            # Make request to Paystack
            headers = {
                "Authorization": f"Bearer {gateway.secret_key}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(paystack_url, json=payload, headers=headers)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('status'):
                # Payment URL from Paystack
                payment_url = response_data['data']['authorization_url']
                
                # Update payment with Paystack reference
                payment.gateway_reference = response_data['data']['reference']
                payment.save()
                
                logger.info(f"Payment initialized successfully: {payment.reference} for {user_data.get('email')}")
                
                return Response({
                    'success': True,
                    'data': {
                        'payment_url': payment_url,
                        'reference': payment.reference,
                        'amount': float(amount),
                        'currency': currency,
                        'gateway': gateway_name,
                        'callback_url': payload['callback_url'],
                        'paystack_reference': response_data['data']['reference'],
                        'description': 'NCLEX Keys Platform Access - Full Course Access'
                    }
                }, status=status.HTTP_200_OK)
            else:
                # Paystack error
                error_message = response_data.get('message', 'Payment initialization failed')
                logger.error(f"Paystack error: {error_message}")
                
                # Mark payment as failed
                payment.status = 'failed'
                payment.save()
                
                return Response({
                    'success': False,
                    'error': {
                        'message': f'Payment gateway error: {error_message}'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Payment initialization error: {str(e)}")
            
            # Mark payment as failed
            payment.status = 'failed'
            payment.save()
            
            return Response({
                'success': False,
                'error': {
                    'message': 'Failed to initialize payment. Please try again.'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Payment initialization error: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'message': 'An unexpected error occurred. Please try again.'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow unauthenticated access for payment verification
def verify_payment(request, reference):
    """
    Verify payment status for student registration
    POST /api/payments/verify/{reference}/
    """
    try:
        # Find payment by reference
        try:
            payment = Payment.objects.get(reference=reference)
        except Payment.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'message': 'Payment not found with this reference.'
                }
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if payment is already completed
        if payment.status == 'completed':
            return Response({
                'success': True,
                'data': {
                    'payment': {
                        'reference': payment.reference,
                        'status': payment.status,
                        'amount': float(payment.amount),
                        'currency': payment.currency,
                        'completed_at': payment.completed_at
                    },
                    'message': 'Payment already verified'
                }
            }, status=status.HTTP_200_OK)
        
        # For student registration payments, we'll mark them as completed
        # In production, you would verify with Paystack webhook
        if payment.payment_method == 'student_registration':
            try:
                # Mark payment as completed
                payment.status = 'completed'
                payment.completed_at = timezone.now()
                payment.save()
                
                logger.info(f"Student registration payment {reference} marked as completed")
                
                return Response({
                    'success': True,
                    'data': {
                        'payment': {
                            'reference': payment.reference,
                            'status': payment.status,
                            'amount': float(payment.amount),
                            'currency': payment.currency,
                            'completed_at': payment.completed_at,
                            'description': 'NCLEX Keys Platform Access - Full Course Access'
                        },
                        'message': 'Payment verified successfully. You can now complete your registration.'
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
        else:
            return Response({
                'success': False,
                'error': {
                    'message': 'Invalid payment type for verification'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'message': 'An error occurred during payment verification'
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


def simple_test(request):
    """
    Very simple test endpoint - no Django REST framework
    """
    return HttpResponse("Payment endpoints are working!", content_type="text/plain")

@api_view(['GET'])
@permission_classes([AllowAny])
def debug_payment_endpoint(request):
    """
    Debug endpoint to test if payment URLs are accessible
    GET /api/payments/debug/
    """
    return Response({
        'success': True,
        'message': 'Payment endpoints are accessible',
        'timestamp': timezone.now().isoformat(),
        'debug': True
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def test_student_registration_payment(request):
    """
    Test endpoint for simulating successful student registration payment
    POST /api/payments/test-student-registration/
    """
    try:
        logger.info("Test payment endpoint called")
        
        # Only allow in development
        if not settings.DEBUG:
            logger.warning("Test endpoint called in production mode")
            return Response({
                'success': False,
                'error': {
                    'message': 'Test endpoint only available in development mode'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        logger.info("Development mode confirmed, proceeding with test payment")
        
        amount = request.data.get('amount', 30000)
        currency = request.data.get('currency', 'NGN')
        
        logger.info(f"Creating test payment: {amount} {currency}")
        
        # Get or create payment gateway
        try:
            logger.info("Attempting to get/create payment gateway")
            gateway = PaymentGateway.objects.get(name='paystack', is_active=True)
            logger.info(f"Found existing gateway: {gateway.id}")
        except PaymentGateway.DoesNotExist:
            logger.info("Creating new Paystack gateway")
            # Create default Paystack gateway if none exists
            gateway = PaymentGateway.objects.create(
                name='paystack',
                display_name='Paystack',
                is_active=True,
                is_default=True,
                public_key=getattr(settings, 'PAYSTACK_PUBLIC_KEY', ''),
                secret_key=getattr(settings, 'PAYSTACK_SECRET_KEY', ''),
                webhook_secret=getattr(settings, 'PAYSTACK_WEBHOOK_SECRET', ''),
                supported_currencies=['NGN', 'USD', 'GHS', 'KES'],
                transaction_fee_percentage=0.0150,  # 1.5%
                transaction_fee_cap=2000.00,  # 2000 NGN cap
                supports_transfers=True,
                minimum_transfer_amount=1000.00
            )
            logger.info(f"Created new gateway: {gateway.id}")
        
        # Create test payment record
        logger.info("Creating payment record")
        
        # Generate test reference
        test_reference = f"TEST-{uuid.uuid4().hex[:8].upper()}"
        
        # Prepare payment data
        payment_data = {
            'reference': test_reference,
            'gateway': gateway,
            'amount': amount,
            'currency': currency,
            'status': 'completed',
            'payment_method': 'student_registration',
            'customer_email': 'test@example.com',
            'customer_name': 'Test User',
            'customer_phone': '+2348000000000',
            'paid_at': timezone.now(),
            'metadata': {
                'payment_type': 'student_registration',
                'description': 'NCLEX Keys Platform Access - Full Course Access (Test)',
                'test_mode': True
            }
        }
        
        logger.info(f"Payment data prepared: {payment_data}")
        
        try:
            payment = Payment.objects.create(**payment_data)
            logger.info(f"Test payment created successfully: {payment.reference}")
        except Exception as create_error:
            logger.error(f"Error creating payment: {str(create_error)}")
            logger.error(f"Payment data: {payment_data}")
            raise create_error
        
        return Response({
            'success': True,
            'reference': payment.reference,
            'amount': float(amount),
            'currency': currency,
            'status': 'completed',
            'message': 'Test payment created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Test payment creation error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return Response({
            'success': False,
            'error': {
                'message': f'Failed to create test payment: {str(e)}',
                'type': type(e).__name__
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)