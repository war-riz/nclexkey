# test_paystack_credentials.py
"""
Django management script to test Paystack credentials
Run this in your Django project directory: python test_paystack_credentials.py
"""

import os
import sys
import django
import requests
import json
from datetime import datetime

# Add your Django project to the Python path
sys.path.append('.')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from payments.models import PaymentGateway

def test_paystack_credentials():
    """Test Paystack API credentials"""
    print("=" * 60)
    print("PAYSTACK CREDENTIALS TEST")
    print("=" * 60)
    
    try:
        # Get Paystack gateway from database
        gateway = PaymentGateway.objects.filter(name='paystack', is_active=True).first()
        
        if not gateway:
            print("❌ ERROR: No active Paystack gateway found in database")
            print("\nTo fix this, create a PaymentGateway record:")
            print("python manage.py shell")
            print(">>> from payments.models import PaymentGateway")
            print(">>> PaymentGateway.objects.create(")
            print(">>>     name='paystack',")
            print(">>>     display_name='Paystack',")
            print(">>>     is_active=True,")
            print(">>>     secret_key='sk_test_your_key_here',")
            print(">>>     public_key='pk_test_your_key_here'")
            print(">>> )")
            return False
            
        print(f"✅ Found Paystack gateway: {gateway.display_name}")
        print(f"   - Is Active: {gateway.is_active}")
        print(f"   - Has Secret Key: {'Yes' if gateway.secret_key else 'No'}")
        print(f"   - Secret Key Preview: {gateway.secret_key[:15]}..." if gateway.secret_key else "   - Secret Key: NOT SET")
        print(f"   - Has Public Key: {'Yes' if gateway.public_key else 'No'}")
        print(f"   - Public Key Preview: {gateway.public_key[:15]}..." if gateway.public_key else "   - Public Key: NOT SET")
        
        if not gateway.secret_key:
            print("\n❌ ERROR: Secret key is missing!")
            return False
            
        # Test 1: Basic Authentication
        print("\n" + "-" * 40)
        print("TEST 1: Basic API Authentication")
        print("-" * 40)
        
        headers = {
            "Authorization": f"Bearer {gateway.secret_key}",
            "Content-Type": "application/json",
        }
        
        response = requests.get("https://api.paystack.co/bank", headers=headers, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Basic authentication works!")
            banks_data = response.json()
            if banks_data.get('status') and banks_data.get('data'):
                print(f"   - Retrieved {len(banks_data['data'])} banks")
        elif response.status_code == 401:
            print("❌ FAILED: 401 Unauthorized - Invalid secret key!")
            print("   Check your secret key in the database")
            return False
        else:
            print(f"❌ FAILED: Unexpected response - {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Response: {response.text}")
            return False
        
        # Test 2: Customer Creation (required first step)
        print("\n" + "-" * 40)
        print("TEST 2: Customer Creation")
        print("-" * 40)
        
        customer_payload = {
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "Customer",
            "phone": "+2348100000000"
        }
        
        response = requests.post(
            "https://api.paystack.co/customer", 
            headers=headers, 
            json=customer_payload, 
            timeout=30
        )
        
        print(f"Customer Creation Status: {response.status_code}")
        customer_code = None
        
        if response.status_code == 200:
            customer_data = response.json()
            if customer_data.get('status'):
                customer_code = customer_data['data']['customer_code']
                print(f"✅ Customer created: {customer_code}")
        elif response.status_code == 400:
            # Customer might already exist
            print("ℹ️  Customer might already exist, trying to fetch...")
            get_response = requests.get(
                f"https://api.paystack.co/customer/test@example.com",
                headers=headers,
                timeout=30
            )
            if get_response.status_code == 200:
                customer_data = get_response.json()
                if customer_data.get('status'):
                    customer_code = customer_data['data']['customer_code']
                    print(f"✅ Found existing customer: {customer_code}")
        
        # Test 3: Dedicated Account Creation (the failing endpoint)
        print("\n" + "-" * 40)
        print("TEST 3: Dedicated Account Creation")
        print("-" * 40)
        
        if not customer_code:
            print("❌ No customer code available for testing dedicated accounts")
            return False
            
        test_payload = {
            "customer": customer_code,  # Use customer code, not email
            "preferred_bank": "wema-bank"
        }
        
        response = requests.post(
            "https://api.paystack.co/dedicated_account", 
            headers=headers, 
            json=test_payload, 
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Dedicated account endpoint works!")
            account_data = response.json()
            if account_data.get('status'):
                data = account_data.get('data', {})
                print(f"   - Account Number: {data.get('account_number', 'N/A')}")
                print(f"   - Account Name: {data.get('account_name', 'N/A')}")
                print(f"   - Bank: {data.get('bank', {}).get('name', 'N/A')}")
        elif response.status_code == 401:
            print("❌ FAILED: 401 Unauthorized for dedicated account!")
            print("   This specific endpoint might need special permissions")
            print("   Contact Paystack support or check your account settings")
            return False
        elif response.status_code == 400:
            error_data = response.json()
            print("⚠️  WARNING: 400 Bad Request")
            print(f"   Error: {error_data.get('message', 'Unknown error')}")
            if 'customer' in error_data.get('message', '').lower():
                print("   This is likely due to test email. The API key works!")
                return True
        else:
            print(f"❌ FAILED: Status {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Response: {response.text}")
            return False
        
        # Test 3: Transaction Verification
        print("\n" + "-" * 40)
        print("TEST 3: Transaction Verification Endpoint")
        print("-" * 40)
        
        # Use a dummy reference that doesn't exist
        dummy_ref = "test_ref_123456"
        response = requests.get(
            f"https://api.paystack.co/transaction/verify/{dummy_ref}", 
            headers=headers, 
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("✅ SUCCESS: Verification endpoint accessible (404 expected for dummy ref)")
        elif response.status_code == 401:
            print("❌ FAILED: 401 Unauthorized for verification!")
            return False
        else:
            print(f"ℹ️  INFO: Got {response.status_code} (might be okay)")
        
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print("✅ Paystack credentials appear to be working!")
        print("✅ Basic API authentication successful")
        print("✅ Your secret key is valid")
        
        if response.status_code in [400, 404]:  # These are acceptable for our tests
            print("✅ API endpoints are accessible")
        
        print(f"\nTime: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")
        print("   Check your internet connection")
        return False
    except Exception as e:
        print(f"❌ SCRIPT ERROR: {e}")
        return False

def show_current_config():
    """Show current Paystack configuration"""
    try:
        gateway = PaymentGateway.objects.filter(name='paystack').first()
        if gateway:
            print("\nCURRENT PAYSTACK CONFIG:")
            print(f"  Name: {gateway.name}")
            print(f"  Display Name: {gateway.display_name}")
            print(f"  Is Active: {gateway.is_active}")
            print(f"  Secret Key Set: {'Yes' if gateway.secret_key else 'No'}")
            print(f"  Public Key Set: {'Yes' if gateway.public_key else 'No'}")
            print(f"  Supports Transfers: {gateway.supports_transfers}")
            print(f"  Created: {gateway.created_at}")
        else:
            print("No Paystack gateway found in database")
    except Exception as e:
        print(f"Error reading config: {e}")

if __name__ == "__main__":
    print("Starting Paystack credentials test...")
    show_current_config()
    success = test_paystack_credentials()
    
    if not success:
        print("\n💡 NEXT STEPS:")
        print("1. Verify your secret key in Django admin or database")
        print("2. Make sure you're using the correct environment (test/live)")
        print("3. Check Paystack dashboard for any account restrictions")
        print("4. Contact Paystack support if issue persists")
    else:
        print("\n🎉 All tests passed! Your Paystack integration should work.")