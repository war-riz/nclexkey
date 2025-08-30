# courses/urls.py
from django.urls import path, include

app_name = 'payments'

urlpatterns = [
    # Core payment processing (students) and amin overview
    path('api/', include('payments.payment_urls')),

    # Webhooks (external calls from payment gateways)
    path('api/payments/webhooks/', include('payments.webhook_urls')),

    # Refunds
    path('api/payments/', include('payments.refund_urls')),

    # Bank account and payouts (instructors)
    path('api/', include('payments.bank_urls')),

    # Instructor earnings and admin payouts
    path('api/', include('payments.payout_urls')),
]