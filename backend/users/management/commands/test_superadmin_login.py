from django.core.management.base import BaseCommand
from django.test import Client
from django.urls import reverse
import json

class Command(BaseCommand):
    help = 'Test superadmin login endpoint'

    def handle(self, *args, **options):
        client = Client()
        
        # Test the superadmin login endpoint
        url = '/api/superadmin/login'
        
        # Test data
        test_data = {
            'email': 'admin@test.com',  # Replace with actual superadmin email
            'password': 'test123'
        }
        
        self.stdout.write(f"Testing endpoint: {url}")
        self.stdout.write(f"Test data: {test_data}")
        
        try:
            response = client.post(url, data=json.dumps(test_data), content_type='application/json')
            
            self.stdout.write(f"Status Code: {response.status_code}")
            self.stdout.write(f"Response: {response.content.decode()}")
            
            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS("✅ Superadmin login endpoint is working!"))
            else:
                self.stdout.write(self.style.WARNING("⚠️ Endpoint responded but with non-200 status"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error testing endpoint: {str(e)}"))



