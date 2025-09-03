#!/usr/bin/env python
"""
Management command to create the default instructor user
This ensures the instructor can always login with the default credentials
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Create default instructor user for NCLEX platform'

    def handle(self, *args, **options):
        self.stdout.write("🔧 Setting up default instructor user...")
        
        try:
            with transaction.atomic():
                # Check if instructor already exists
                instructor_email = "instructor@nclexprep.com"
                
                if User.objects.filter(email=instructor_email).exists():
                    instructor = User.objects.get(email=instructor_email)
                    self.stdout.write(f"✅ Instructor already exists: {instructor.full_name}")
                    
                    # Update password to ensure it matches
                    instructor.set_password("instructor123")
                    instructor.save()
                    self.stdout.write("✅ Instructor password updated")
                    
                else:
                    # Create new instructor
                    instructor = User.objects.create(
                        email=instructor_email,
                        username=instructor_email.split('@')[0],
                        full_name="NCLEX Instructor",
                        role="instructor",
                        phone_number="+2348000000000",
                        is_email_verified=True,
                        is_active=True,
                        is_staff=True,
                        is_superuser=False
                    )
                    instructor.set_password("instructor123")
                    instructor.save()
                    
                    self.stdout.write(f"✅ Default instructor created: {instructor.full_name}")
                    self.stdout.write(f"   Email: {instructor.email}")
                    self.stdout.write(f"   Password: instructor123")
                    self.stdout.write(f"   Role: {instructor.role}")
                
                # Verify instructor can authenticate
                from django.contrib.auth import authenticate
                auth_user = authenticate(username=instructor_email, password="instructor123")
                
                if auth_user and auth_user.is_authenticated:
                    self.stdout.write("✅ Instructor authentication verified successfully!")
                else:
                    self.stdout.write("❌ Instructor authentication failed!")
                    
        except Exception as e:
            self.stdout.write(f"❌ Error creating instructor: {str(e)}")
            raise
