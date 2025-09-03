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
JWT_SECRET_KEY = 'your-secret-key-here'  # Move to settings.py in production
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
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Student registration endpoint"""
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('full_name')
        phone_number = request.data.get('phone_number')
        
        if not all([email, password, full_name]):
            return Response({
                'detail': 'Email, password, and full_name are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'detail': 'User with this email already exists.'
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
        
        # Generate JWT token
        token = generate_jwt_token(user)
        
        return Response({
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
            'detail': 'An error occurred during registration.'
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
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout endpoint"""
    try:
        # In a simple JWT system, we just return success
        # In production, you might want to blacklist the token
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