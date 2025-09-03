# payments/urls.py
from django.urls import path, include

app_name = 'payments'

urlpatterns = [
    # Core payment processing (students) and admin overview
    path('api/payments', include('payments.payment_urls')),
]