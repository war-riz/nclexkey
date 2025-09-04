from django.core.management.base import BaseCommand
from django.db import transaction
from payments.models import PaymentGateway, Payment
from courses.models import CourseCategory
from users.models import User
from django.utils import timezone
import uuid


class Command(BaseCommand):
    help = 'Set up initial data for NCLEX platform'

    def handle(self, *args, **options):
        self.stdout.write('Setting up initial data...')
        
        with transaction.atomic():
            # Create payment gateways
            self.setup_payment_gateways()
            
            # Create course categories
            self.setup_course_categories()
            
            # Create a test payment for registration testing
            self.setup_test_payment()
            
        self.stdout.write(self.style.SUCCESS('Initial data setup completed successfully!'))

    def setup_payment_gateways(self):
        """Create payment gateway configurations"""
        gateways_data = [
            {
                'name': 'paystack',
                'display_name': 'Paystack',
                'is_active': True,
                'is_default': True,
                'public_key': 'pk_test_89113c66822ee965d55040c96fe15d986bc4027e',
                'secret_key': 'sk_test_cb15fc824410087d4c44feb154deebcc8dbbc31e',
                'supported_currencies': ['NGN', 'USD', 'GHS', 'ZAR'],
                'transaction_fee_percentage': 0.0150,
                'supports_transfers': True,
            },
            {
                'name': 'flutterwave',
                'display_name': 'Flutterwave',
                'is_active': True,
                'is_default': False,
                'public_key': 'FLWPUBK_TEST-5fabb620c56266196d9b0137bea69763-X',
                'secret_key': 'FLWSECK_TEST-d51c473fb205c99e70d234fb7e66dfa8-X',
                'supported_currencies': ['NGN', 'USD', 'EUR', 'GBP', 'GHS', 'KES', 'ZAR'],
                'transaction_fee_percentage': 0.0140,
                'supports_transfers': True,
            }
        ]
        
        for gateway_data in gateways_data:
            PaymentGateway.objects.get_or_create(
                name=gateway_data['name'],
                defaults=gateway_data
            )
            self.stdout.write(f'Payment gateway {gateway_data["name"]} configured')

    def setup_course_categories(self):
        """Create basic course categories for NCLEX"""
        categories = [
            'Fundamentals of Nursing',
            'Medical-Surgical Nursing',
            'Pediatric Nursing',
            'Obstetric Nursing',
            'Psychiatric Nursing',
            'Pharmacology',
            'Health Assessment',
            'Critical Care',
            'Emergency Nursing',
            'Community Health'
        ]
        
        for category_name in categories:
            CourseCategory.objects.get_or_create(
                name=category_name,
                defaults={
                    'description': f'NCLEX preparation courses for {category_name}',
                    'is_active': True
                }
            )
        self.stdout.write(f'Created {len(categories)} course categories')

    def setup_test_payment(self):
        """Create a test payment for registration testing"""
        try:
            # Get default payment gateway
            gateway = PaymentGateway.objects.filter(is_default=True).first()
            if not gateway:
                gateway = PaymentGateway.objects.first()
            
            if gateway:
                # Create a test completed payment
                test_payment, created = Payment.objects.get_or_create(
                    reference='TEST_REG_001',
                    defaults={
                        'gateway': gateway,
                        'amount': 5000.00,
                        'currency': 'NGN',
                        'status': 'completed',
                        'payment_method': 'card',
                        'gateway_fee': 75.00,
                        'net_amount': 4925.00,
                        'metadata': {
                            'test_payment': True,
                            'purpose': 'student_registration_test'
                        }
                    }
                )
                
                if created:
                    self.stdout.write('Created test payment: TEST_REG_001')
                    self.stdout.write('You can use this reference for testing student registration')
                else:
                    self.stdout.write('Test payment already exists: TEST_REG_001')
                    
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not create test payment: {e}'))
