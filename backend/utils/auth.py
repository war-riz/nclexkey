# utils/auth.py
import jwt
import logging
from datetime import datetime, timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class JWTTokenManager:
    """Simple JWT token management"""
    
    @staticmethod
    def generate_access_token(user):
        """Generate JWT access token"""
        now = datetime.utcnow()
        exp = now + timedelta(hours=24)  # 24 hour expiry
        
        payload = {
            'user_id': str(user.id),
            'email': user.email,
            'role': user.role,
            'exp': exp,
            'iat': now,
            'type': 'access'
        }
        
        token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm='HS256')
        return token
    
    @staticmethod
    def verify_access_token(token):
        """Verify JWT access token"""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
            return payload, None
        except jwt.ExpiredSignatureError:
            return None, "Token expired"
        except jwt.InvalidTokenError:
            return None, "Invalid token"
        except Exception as e:
            return None, str(e)


class EmailService:
    """Simple email service"""
    
    @staticmethod
    def send_verification_email(user, token):
        """Send email verification email"""
        try:
            subject = 'Verify Your Email - NCLEX Virtual School'
            html_message = render_to_string('emails/verify_email.html', {
                'user': user,
                'token': token
            })
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")
            return False
    
    @staticmethod
    def send_welcome_email(user):
        """Send welcome email to new users"""
        try:
            subject = 'Welcome to NCLEX Virtual School!'
            html_message = render_to_string('emails/welcome.html', {
                'user': user
            })
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")
            return False


class SecurityUtils:
    """Basic security utilities"""
    
    @staticmethod
    def get_client_ip(request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @staticmethod
    def generate_device_fingerprint(request):
        """Generate simple device fingerprint"""
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        ip = SecurityUtils.get_client_ip(request)
        return f"{ip}_{hash(user_agent) % 1000000}"


class SecurityMonitor:
    """Security monitoring and logging"""
    
    @staticmethod
    def log_security_event(event_type, user, description, severity='INFO'):
        """Log security events"""
        logger.warning(f"SECURITY EVENT [{severity}]: {event_type} - {description} - User: {user}")