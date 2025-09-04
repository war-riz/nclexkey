# users/auth_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import make_password
from .models import User
from django.utils import timezone
import jwt
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# JWT Settings
from django.conf import settings
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 24

def generate_jwt_token(user):
    """Generate JWT token for user"""
    payload = {
        'user_id': str(user.id),  # Convert UUID to string
        'email': user.email,
        'role': user.role,
        'exp': timezone.now() + timedelta(hours=JWT_EXPIRY_HOURS),
        'iat': timezone.now()
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Student registration endpoint with payment verification"""
    try:
        # Check if rate limiting is disabled for development
        from django.conf import settings
        is_development = getattr(settings, 'DISABLE_RATE_LIMITING', False)
        
        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('fullName') or request.data.get('full_name')
        phone_number = request.data.get('phoneNumber') or request.data.get('phone_number')
        payment_reference = request.data.get('paymentReference') or request.data.get('payment_reference')
        
        if not all([email, password, full_name]):
            return Response({
                'success': False,
                'error': {
                    'message': 'Email, password, and full name are required.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'success': False,
                'error': {
                    'message': 'User with this email already exists.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify payment before creating user
        if not payment_reference:
            return Response({
                'success': False,
                'error': {
                    'message': 'Payment reference is required for student registration.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if payment exists and is completed
        try:
            from payments.models import Payment
            payment = Payment.objects.get(reference=payment_reference)
            
            if payment.status != 'completed':
                return Response({
                    'success': False,
                    'error': {
                        'message': 'Payment not completed. Please complete payment first.'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Payment.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'message': 'Invalid payment reference. Please complete payment first.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create student user
        user = User.objects.create(
            email=email,
            full_name=full_name,
            phone_number=phone_number,
            role='student',
            username=email,  # Use email as username
            is_email_verified=False  # Students need email verification
        )
        user.set_password(password)
        user.save()
        
        # Link payment to user
        payment.user = user
        payment.save()
        
        # Generate JWT token
        token = generate_jwt_token(user)
        
        logger.info(f"Student registration successful: {email} (Development: {is_development})")
        
        return Response({
            'success': True,
            'message': 'Registration successful. Please verify your email.',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'is_email_verified': user.is_email_verified
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'message': 'An error occurred during registration.'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login endpoint for both students and instructors"""
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'detail': 'Email and password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = authenticate(request, username=email, password=password)
        
        if not user:
            return Response({
                'detail': 'Invalid credentials.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if account is active
        if not user.is_active:
            return Response({
                'detail': 'Account is deactivated.'
            }, status=status.HTTP_423_LOCKED)
        
        # Generate JWT token
        token = generate_jwt_token(user)
        
        return Response({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'is_email_verified': user.is_email_verified
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response({
            'detail': 'An error occurred during login.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def instructor_login(request):
    """Instructor login endpoint"""
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'detail': 'Email and password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = authenticate(request, username=email, password=password)
        
        if not user:
            return Response({
                'detail': 'Invalid credentials.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is instructor
        if user.role != 'instructor':
            return Response({
                'detail': 'Access denied. Instructor privileges required.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if account is active
        if not user.is_active:
            return Response({
                'detail': 'Account is deactivated.'
            }, status=status.HTTP_423_LOCKED)
        
        # Generate JWT token
        token = generate_jwt_token(user)
        
        return Response({
            'message': 'Instructor login successful',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'is_email_verified': user.is_email_verified
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Instructor login error: {str(e)}")
        return Response({
            'detail': 'An error occurred during login.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    """Logout endpoint - no authentication required"""
    try:
        # Get refresh token from request body
        refresh_token = request.data.get('refresh_token')
        
        if refresh_token:
            # In production, you might want to blacklist the token
            # For now, just return success
            logger.info(f"User logged out with refresh token: {refresh_token[:20]}...")
        
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response({
            'detail': 'An error occurred during logout.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get user profile"""
    try:
        user = request.user
        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.full_name,
                'role': user.role,
                'phone_number': user.phone_number,
                'bio': user.bio,
                'is_email_verified': user.is_email_verified,
                'created_at': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        return Response({
            'detail': 'An error occurred while fetching profile.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile"""
    try:
        user = request.user
        
        # Update allowed fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'phone_number' in request.data:
            user.phone_number = request.data['phone_number']
        if 'bio' in request.data:
            user.bio = request.data['bio']
        
        user.save()
        
        return Response({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.full_name,
                'role': user.role,
                'phone_number': user.phone_number,
                'bio': user.bio,
                'is_email_verified': user.is_email_verified
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Update profile error: {str(e)}")
        return Response({
            'detail': 'An error occurred while updating profile.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def test_rate_limiting(request):
    """Test endpoint to check if rate limiting is working"""
    try:
        from django.conf import settings
        is_development = getattr(settings, 'DISABLE_RATE_LIMITING', False)
        
        # Clear any existing cache
        from django.core.cache import cache
        cache.clear()
        
        return Response({
            'success': True,
            'message': 'Rate limiting test endpoint',
            'rate_limiting_disabled': is_development,
            'debug_mode': settings.DEBUG,
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Rate limiting test error: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def clear_rate_limit_cache(request):
    """Development endpoint to clear rate limiting cache"""
    try:
        from django.conf import settings
        if not getattr(settings, 'DISABLE_RATE_LIMITING', False):
            return Response({
                'success': False,
                'error': {
                    'message': 'This endpoint is only available in development mode.'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        from django.core.cache import cache
        # Clear all rate limiting cache
        cache.clear()
        
        logger.info("Rate limiting cache cleared for development")
        
        return Response({
            'success': True,
            'message': 'Rate limiting cache cleared successfully.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error clearing rate limit cache: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'message': 'Failed to clear rate limiting cache.'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_instructors(request):
    """Get list of all instructors for messaging"""
    try:
        # Get all active instructors
        instructors = User.objects.filter(
            role='instructor',
            is_active=True
        ).order_by('full_name')
        
        instructors_data = []
        for instructor in instructors:
            instructors_data.append({
                'id': str(instructor.id),
                'full_name': instructor.full_name,
                'email': instructor.email,
                'specialty': getattr(instructor, 'specialty', 'NCLEX Preparation'),
                'bio': getattr(instructor, 'bio', ''),
                'is_available': True  # You can add availability logic here
            })
        
        return Response({
            'success': True,
            'data': instructors_data,
            'total': len(instructors_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get instructors error: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'message': 'Failed to fetch instructors.'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)