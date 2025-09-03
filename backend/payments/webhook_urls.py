# payments/webhook_urls.py
from django.urls import path
from . import webhook_views

urlpatterns = [
    path('paystack', webhook_views.paystack_webhook, name='paystack_webhook'),
    path('flutterwave', webhook_views.flutterwave_webhook, name='flutterwave_webhook'),
]