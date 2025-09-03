# users/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid


class User(AbstractUser):
    """
    Simple User model with default values for required fields
    """
    ROLE_CHOICES = [
        ('instructor', 'Instructor'),
        ('student', 'Student'),
    ]
    
    # Override ID to use UUID
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Essential fields only
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    
    # Basic profile fields
    phone_number = models.CharField(max_length=15, default='', blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    
    # Verification
    is_email_verified = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(blank=True, null=True)
    account_locked_at = models.DateTimeField(blank=True, null=True)
    
    # Required fields with defaults to satisfy database constraints
    failed_login_attempts = models.IntegerField(default=0)
    password_changed_at = models.DateTimeField(default=timezone.now)
    is_deletion_pending = models.BooleanField(default=False)
    two_factor_enabled = models.BooleanField(default=False)
    backup_codes = models.JSONField(default=dict)
    timezone = models.CharField(max_length=50, default='UTC')
    moderation_reason = models.TextField(default='')
    moderation_status = models.CharField(max_length=20, default='active')
    
    # Use email as username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.full_name} ({self.email})"
    
    def save(self, *args, **kwargs):
        # Auto-generate username from email if not provided
        if not self.username:
            self.username = self.email.split('@')[0]
        
        # Auto-verify instructors (no email verification needed)
        if self.role == 'instructor':
            self.is_email_verified = True
        super().save(*args, **kwargs)
    
    @property
    def first_name(self):
        """Get first name from full_name"""
        return self.full_name.split()[0] if self.full_name else ''
    
    @property
    def last_name(self):
        """Get last name from full_name"""
        parts = self.full_name.split() if self.full_name else []
        return ' '.join(parts[1:]) if len(parts) > 1 else ''
    
    def is_account_locked(self):
        """Check if account is currently locked"""
        if self.account_locked_at:
            # Account is locked if locked_at is in the future
            return self.account_locked_at > timezone.now()
        return False