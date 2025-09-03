# users/management/commands/create_instructor.py
from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Create an instructor account'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Instructor email')
        parser.add_argument('password', type=str, help='Instructor password')
        parser.add_argument('first_name', type=str, help='Instructor first name')
        parser.add_argument('last_name', type=str, help='Instructor last name')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']
        
        try:
            # Check if user already exists
            if User.objects.filter(email=email).exists():
                self.stdout.write(
                    self.style.ERROR(f'User with email {email} already exists!')
                )
                return
            
            # Create instructor user
            user = User.objects.create(
                email=email,
                first_name=first_name,
                last_name=last_name,
                role='instructor',
                username=email,  # Use email as username
                is_email_verified=True  # Instructors are auto-verified
            )
            user.set_password(password)
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created instructor account:\n'
                    f'  Email: {email}\n'
                    f'  Name: {first_name} {last_name}\n'
                    f'  Role: {user.role}\n'
                    f'  Verified: {user.is_email_verified}'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating instructor: {str(e)}')
            )


