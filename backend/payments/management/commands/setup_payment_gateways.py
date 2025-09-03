# commands/setup_payment_gateways.py
import os
from django.core.management.base import BaseCommand
from payments.models import PaymentGateway
from django.conf import settings

class Command(BaseCommand):
    help = 'Set up payment gateways with proper configuration'

    def handle(self, *args, **options):
        self.stdout.write("🔧 Setting up Payment Gateways...")
        
        # Setup Paystack
        self.setup_paystack()
        
        # Setup Flutterwave
        self.setup_flutterwave()
        
        self.stdout.write("✅ Payment Gateway Setup Complete!")

    def setup_paystack(self):
        """Set up Paystack payment gateway"""
        self.stdout.write("\n💳 Setting up Paystack...")
        
        try:
            paystack, created = PaymentGateway.objects.get_or_create(
                name='paystack',
                defaults={
                    'display_name': 'Paystack',
                    'is_active': True,
                    'is_default': True,
                    'public_key': getattr(settings, 'PAYSTACK_PUBLIC_KEY', ''),
                    'secret_key': getattr(settings, 'PAYSTACK_SECRET_KEY', ''),
                    'webhook_secret': getattr(settings, 'PAYSTACK_WEBHOOK_SECRET', ''),
                    'supported_currencies': ['NGN', 'USD', 'GHS', 'KES'],
                    'transaction_fee_percentage': 0.0150,  # 1.5%
                    'transaction_fee_cap': 2000.00,  # 2000 NGN cap
                    'supports_transfers': True,
                    'minimum_transfer_amount': 1000.00
                }
            )
            
            if not created:
                # Update existing gateway
                paystack.public_key = getattr(settings, 'PAYSTACK_PUBLIC_KEY', '')
                paystack.secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
                paystack.webhook_secret = getattr(settings, 'PAYSTACK_WEBHOOK_SECRET', '')
                paystack.is_active = True
                paystack.save()
                self.stdout.write("✅ Paystack gateway updated")
            else:
                self.stdout.write("✅ Paystack gateway created")
                
            # Check configuration
            if paystack.public_key and paystack.secret_key:
                self.stdout.write(f"   Public Key: {paystack.public_key[:20]}...")
                self.stdout.write(f"   Secret Key: {paystack.secret_key[:20]}...")
                self.stdout.write(f"   Webhook Secret: {'✅ Set' if paystack.webhook_secret else '❌ Not Set'}")
            else:
                self.stdout.write("❌ Paystack keys not configured in settings")
                
        except Exception as e:
            self.stdout.write(f"❌ Error setting up Paystack: {str(e)}")

    def setup_flutterwave(self):
        """Set up Flutterwave payment gateway"""
        self.stdout.write("\n🌍 Setting up Flutterwave...")
        
        try:
            flutterwave, created = PaymentGateway.objects.get_or_create(
                name='flutterwave',
                defaults={
                    'display_name': 'Flutterwave',
                    'is_active': True,
                    'is_default': False,
                    'public_key': getattr(settings, 'FLUTTERWAVE_PUBLIC_KEY', ''),
                    'secret_key': getattr(settings, 'FLUTTERWAVE_SECRET_KEY', ''),
                    'webhook_secret': getattr(settings, 'FLUTTERWAVE_WEBHOOK_SECRET', ''),
                    'supported_currencies': ['NGN', 'USD', 'GHS', 'KES', 'ZAR'],
                    'transaction_fee_percentage': 0.0140,  # 1.4%
                    'transaction_fee_cap': 2000.00,  # 2000 NGN cap
                    'supports_transfers': True,
                    'minimum_transfer_amount': 1000.00
                }
            )
            
            if not created:
                # Update existing gateway
                flutterwave.public_key = getattr(settings, 'FLUTTERWAVE_PUBLIC_KEY', '')
                flutterwave.secret_key = getattr(settings, 'FLUTTERWAVE_SECRET_KEY', '')
                flutterwave.webhook_secret = getattr(settings, 'FLUTTERWAVE_WEBHOOK_SECRET', '')
                flutterwave.is_active = True
                flutterwave.save()
                self.stdout.write("✅ Flutterwave gateway updated")
            else:
                self.stdout.write("✅ Flutterwave gateway created")
                
            # Check configuration
            if flutterwave.public_key and flutterwave.secret_key:
                self.stdout.write(f"   Public Key: {flutterwave.public_key[:20]}...")
                self.stdout.write(f"   Secret Key: {flutterwave.secret_key[:20]}...")
                self.stdout.write(f"   Webhook Secret: {'✅ Set' if flutterwave.webhook_secret else '❌ Not Set'}")
            else:
                self.stdout.write("❌ Flutterwave keys not configured in settings")
                
        except Exception as e:
            self.stdout.write(f"❌ Error setting up Flutterwave: {str(e)}")

    def validate_webhook_urls(self):
        """Validate webhook URLs are accessible"""
        self.stdout.write("\n🌐 Validating Webhook URLs...")
        
        try:
            # Check if webhook URLs are accessible
            from django.test import Client
            client = Client()
            
            # Test Paystack webhook
            response = client.post('/api/payments/webhooks/paystack/', 
                                data='{"test": "data"}', 
                                content_type='application/json')
            if response.status_code in [200, 400, 401]:
                self.stdout.write("✅ Paystack webhook endpoint accessible")
            else:
                self.stdout.write(f"❌ Paystack webhook endpoint issue: {response.status_code}")
            
            # Test Flutterwave webhook
            response = client.post('/api/payments/webhooks/flutterwave/', 
                                data='{"test": "data"}', 
                                content_type='application/json')
            if response.status_code in [200, 400, 401]:
                self.stdout.write("✅ Flutterwave webhook endpoint accessible")
            else:
                self.stdout.write(f"❌ Flutterwave webhook endpoint issue: {response.status_code}")
                
        except Exception as e:
            self.stdout.write(f"❌ Error validating webhook URLs: {str(e)}")