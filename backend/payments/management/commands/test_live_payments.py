from django.core.management.base import BaseCommand
import requests
import json

class Command(BaseCommand):
    help = 'Test payment endpoints with live server'

    def add_arguments(self, parser):
        parser.add_argument(
            '--server',
            type=str,
            default='http://localhost:8000',
            help='Server URL to test against'
        )

    def handle(self, *args, **options):
        server_url = options['server']
        self.stdout.write(f"🔍 Testing Payment Endpoints against {server_url}")
        
        # Test 1: Payment Gateways
        self.test_payment_gateways(server_url)
        
        # Test 2: Payment Initialization
        self.test_payment_initialization(server_url)
        
        # Test 3: Webhook Endpoints
        self.test_webhook_endpoints(server_url)
        
        self.stdout.write("✅ Live Payment Testing Complete!")

    def test_payment_gateways(self, server_url):
        """Test payment gateways endpoint"""
        self.stdout.write("\n💳 Testing Payment Gateways...")
        
        try:
            url = f"{server_url}/api/payments/gateways/"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                self.stdout.write("✅ Payment gateways endpoint working")
                data = response.json()
                gateways = data.get('gateways', [])
                self.stdout.write(f"   Available gateways: {len(gateways)}")
                for gateway in gateways:
                    self.stdout.write(f"   - {gateway.get('name', 'Unknown')}: {gateway.get('display_name', 'Unknown')}")
            else:
                self.stdout.write(f"❌ Payment gateways endpoint failed: {response.status_code}")
                self.stdout.write(f"   Response: {response.text[:200]}")
                
        except requests.exceptions.ConnectionError:
            self.stdout.write("❌ Could not connect to server. Is it running?")
        except Exception as e:
            self.stdout.write(f"❌ Error testing payment gateways: {str(e)}")

    def test_payment_initialization(self, server_url):
        """Test payment initialization endpoint"""
        self.stdout.write("\n🚀 Testing Payment Initialization...")
        
        try:
            url = f"{server_url}/api/payments/initialize/"
            test_data = {
                "course_id": "test-course-id",
                "gateway": "paystack",
                "amount": "5000.00",
                "currency": "NGN"
            }
            
            response = requests.post(url, json=test_data, timeout=10)
            
            if response.status_code in [200, 400, 401]:  # Various expected responses
                self.stdout.write("✅ Payment initialization endpoint working")
                if response.status_code == 200:
                    data = response.json()
                    self.stdout.write(f"   Payment URL: {data.get('payment_url', 'Not provided')[:50]}...")
                else:
                    self.stdout.write(f"   Expected response: {response.status_code}")
            else:
                self.stdout.write(f"❌ Payment initialization failed: {response.status_code}")
                self.stdout.write(f"   Response: {response.text[:200]}")
                
        except requests.exceptions.ConnectionError:
            self.stdout.write("❌ Could not connect to server. Is it running?")
        except Exception as e:
            self.stdout.write(f"❌ Error testing payment initialization: {str(e)}")

    def test_webhook_endpoints(self, server_url):
        """Test webhook endpoints"""
        self.stdout.write("\n🌐 Testing Webhook Endpoints...")
        
        try:
            # Test Paystack webhook
            url = f"{server_url}/api/payments/webhooks/paystack/"
            test_data = {"event": "test", "data": {"reference": "test_ref"}}
            
            response = requests.post(url, json=test_data, timeout=10)
            
            if response.status_code in [200, 400, 401]:  # Various expected responses
                self.stdout.write("✅ Paystack webhook endpoint working")
            else:
                self.stdout.write(f"❌ Paystack webhook endpoint failed: {response.status_code}")
                self.stdout.write(f"   Response: {response.text[:200]}")
            
            # Test Flutterwave webhook
            url = f"{server_url}/api/payments/webhooks/flutterwave/"
            test_data = {"event": "test", "data": {"tx_ref": "test_ref"}}
            
            response = requests.post(url, json=test_data, timeout=10)
            
            if response.status_code in [200, 400, 401]:  # Various expected responses
                self.stdout.write("✅ Flutterwave webhook endpoint working")
            else:
                self.stdout.write(f"❌ Flutterwave webhook endpoint failed: {response.status_code}")
                self.stdout.write(f"   Response: {response.text[:200]}")
                
        except requests.exceptions.ConnectionError:
            self.stdout.write("❌ Could not connect to server. Is it running?")
        except Exception as e:
            self.stdout.write(f"❌ Error testing webhook endpoints: {str(e)}")

    def test_bank_transfer(self, server_url):
        """Test bank transfer functionality"""
        self.stdout.write("\n🏦 Testing Bank Transfer...")
        
        try:
            url = f"{server_url}/api/payments/bank-transfer/test-course-id/initiate/"
            test_data = {"amount": "5000.00"}
            
            response = requests.post(url, json=test_data, timeout=10)
            
            if response.status_code in [200, 400, 401]:  # Various expected responses
                self.stdout.write("✅ Bank transfer initiation endpoint working")
            else:
                self.stdout.write(f"❌ Bank transfer initiation failed: {response.status_code}")
                self.stdout.write(f"   Response: {response.text[:200]}")
                
        except requests.exceptions.ConnectionError:
            self.stdout.write("❌ Could not connect to server. Is it running?")
        except Exception as e:
            self.stdout.write(f"❌ Error testing bank transfer: {str(e)}")



