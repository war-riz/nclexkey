from django.core.management.base import BaseCommand
from django.test import Client
from django.urls import reverse
from payments.models import PaymentGateway, Payment
from courses.models import Course
from users.models import User
import json
import uuid

class Command(BaseCommand):
    help = 'Test all payment integrations comprehensively'

    def handle(self, *args, **options):
        self.stdout.write("🔍 Testing Payment Integrations...")
        
        # Test 1: Check Payment Gateway Configuration
        self.test_payment_gateways()
        
        # Test 2: Test Payment Initialization
        self.test_payment_initialization()
        
        # Test 3: Test Payment Verification
        self.test_payment_verification()
        
        # Test 4: Test Webhook Endpoints
        self.test_webhook_endpoints()
        
        # Test 5: Test Bank Transfer
        self.test_bank_transfer()
        
        self.stdout.write("✅ Payment Integration Testing Complete!")

    def test_payment_gateways(self):
        """Test payment gateway configuration"""
        self.stdout.write("\n📊 Testing Payment Gateway Configuration...")
        
        try:
            # Check if payment gateways exist
            paystack = PaymentGateway.objects.filter(name='paystack', is_active=True).first()
            flutterwave = PaymentGateway.objects.filter(name='flutterwave', is_active=True).first()
            
            if paystack:
                self.stdout.write(f"✅ Paystack: {paystack.display_name} - Active")
                self.stdout.write(f"   Public Key: {paystack.public_key[:20]}...")
                self.stdout.write(f"   Secret Key: {paystack.secret_key[:20]}...")
            else:
                self.stdout.write("❌ Paystack: Not configured or inactive")
            
            if flutterwave:
                self.stdout.write(f"✅ Flutterwave: {flutterwave.display_name} - Active")
                self.stdout.write(f"   Public Key: {flutterwave.public_key[:20]}...")
                self.stdout.write(f"   Secret Key: {flutterwave.secret_key[:20]}...")
            else:
                self.stdout.write("❌ Flutterwave: Not configured or inactive")
                
        except Exception as e:
            self.stdout.write(f"❌ Error testing payment gateways: {str(e)}")

    def test_payment_initialization(self):
        """Test payment initialization endpoints"""
        self.stdout.write("\n💳 Testing Payment Initialization...")
        
        client = Client()
        
        # Test payment gateways endpoint
        try:
            response = client.get('/api/payments/gateways/')
            if response.status_code == 200:
                self.stdout.write("✅ Payment gateways endpoint working")
                data = response.json()
                self.stdout.write(f"   Available gateways: {len(data.get('gateways', []))}")
            else:
                self.stdout.write(f"❌ Payment gateways endpoint failed: {response.status_code}")
        except Exception as e:
            self.stdout.write(f"❌ Error testing payment gateways endpoint: {str(e)}")

    def test_payment_verification(self):
        """Test payment verification endpoints"""
        self.stdout.write("\n🔍 Testing Payment Verification...")
        
        client = Client()
        
        # Test with a dummy reference
        test_reference = "TEST_REF_123"
        try:
            response = client.get(f'/api/payments/verify/{test_reference}/')
            if response.status_code in [200, 404]:  # 404 is expected for non-existent reference
                self.stdout.write("✅ Payment verification endpoint working")
            else:
                self.stdout.write(f"❌ Payment verification endpoint failed: {response.status_code}")
        except Exception as e:
            self.stdout.write(f"❌ Error testing payment verification endpoint: {str(e)}")

    def test_webhook_endpoints(self):
        """Test webhook endpoints"""
        self.stdout.write("\n🌐 Testing Webhook Endpoints...")
        
        client = Client()
        
        # Test Paystack webhook
        try:
            response = client.post('/api/payments/webhooks/paystack/', 
                                data=json.dumps({"event": "test"}), 
                                content_type='application/json')
            if response.status_code in [200, 400, 401]:  # Various expected responses
                self.stdout.write("✅ Paystack webhook endpoint working")
            else:
                self.stdout.write(f"❌ Paystack webhook endpoint failed: {response.status_code}")
        except Exception as e:
            self.stdout.write(f"❌ Error testing Paystack webhook: {str(e)}")
        
        # Test Flutterwave webhook
        try:
            response = client.post('/api/payments/webhooks/flutterwave/', 
                                data=json.dumps({"event": "test"}), 
                                content_type='application/json')
            if response.status_code in [200, 400, 401]:  # Various expected responses
                self.stdout.write("✅ Flutterwave webhook endpoint working")
            else:
                self.stdout.write(f"❌ Flutterwave webhook endpoint failed: {response.status_code}")
        except Exception as e:
            self.stdout.write(f"❌ Error testing Flutterwave webhook: {str(e)}")

    def test_bank_transfer(self):
        """Test bank transfer functionality"""
        self.stdout.write("\n🏦 Testing Bank Transfer...")
        
        client = Client()
        
        # Test bank transfer initiation (will need a valid course ID)
        try:
            # Get first available course
            course = Course.objects.first()
            if course:
                response = client.post(f'/api/payments/bank-transfer/{course.id}/initiate/', 
                                    data=json.dumps({"amount": "5000.00"}), 
                                    content_type='application/json')
                if response.status_code in [200, 400, 401]:  # Various expected responses
                    self.stdout.write("✅ Bank transfer initiation endpoint working")
                else:
                    self.stdout.write(f"❌ Bank transfer initiation failed: {response.status_code}")
            else:
                self.stdout.write("⚠️ No courses available to test bank transfer")
        except Exception as e:
            self.stdout.write(f"❌ Error testing bank transfer: {str(e)}")

    def create_test_data(self):
        """Create test data for payment testing"""
        self.stdout.write("\n📝 Creating Test Data...")
        
        try:
            # Create test user if doesn't exist
            user, created = User.objects.get_or_create(
                email='test@payment.com',
                defaults={
                    'first_name': 'Test',
                    'last_name': 'User',
                    'role': 'student'
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()
                self.stdout.write("✅ Test user created")
            else:
                self.stdout.write("✅ Test user already exists")
            
            # Create test course if doesn't exist
            course, created = Course.objects.get_or_create(
                title='Test Payment Course',
                defaults={
                    'instructor': user,
                    'price': 5000.00,
                    'currency': 'NGN',
                    'description': 'Test course for payment integration'
                }
            )
            if created:
                self.stdout.write("✅ Test course created")
            else:
                self.stdout.write("✅ Test course already exists")
                
        except Exception as e:
            self.stdout.write(f"❌ Error creating test data: {str(e)}")



