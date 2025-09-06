# common/authentication.py
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import AnonymousUser
from users.models import User
import logging

logger = logging.getLogger(__name__)

class JWTAuthentication(BaseAuthentication):
    """
    JWT Authentication for Django REST Framework
    This replaces your middleware approach
    """
    
    def authenticate(self, request):
        """
        Authenticate the request and return a (user, token) tuple or None
        """
        logger.info(f"JWT Authentication attempt for path: {request.path}")
        
        # Skip JWT authentication for admin URLs and static files
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            logger.info("Skipping JWT auth for admin/static path")
            return None
        
        # Get token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        logger.info(f"Authorization header: {auth_header[:50] if auth_header else 'None'}")
        
        if not auth_header or not auth_header.startswith('Bearer '):
            # No token provided - return None (anonymous)
            logger.info("No valid Authorization header found")
            return None
        
        # Extract token
        token = auth_header.split(' ')[1]
        
        try:
            # Verify token using JWT decode directly
            import jwt
            from django.conf import settings
            
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
            
            # Token is valid - get user from database
            try:
                user = User.objects.get(id=payload['user_id'])
            except User.DoesNotExist:
                raise AuthenticationFailed('User account not found. Please login again.')
            
            # Check if user is active
            if not user.is_active:
                raise AuthenticationFailed('Your account has been deactivated. Contact support.')
            
            # Check if account is locked (if method exists)
            if hasattr(user, 'is_account_locked') and user.is_account_locked():
                raise AuthenticationFailed('Your account is locked due to security reasons.')
            
            logger.info(f"User authenticated via JWT: {user.email} with role: {user.role}")
            
            # Return (user, token) tuple
            return (user, token)
            
        except Exception as e:
            logger.error(f"JWT authentication error: {str(e)}")
            raise AuthenticationFailed('Authentication failed. Please try again.')
    
    def authenticate_header(self, request):
        """
        Return the header for 401 responses
        """
        return 'Bearer'