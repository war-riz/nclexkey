# payments/payment_urls.py
from django.urls import path
from . import payment_views

app_name = 'payments'

urlpatterns = [
    # Payment initialization and verification
    path('/initialize', payment_views.initialize_payment, name='initialize-payment'),
    path('/verify/<str:reference>', payment_views.verify_payment, name='verify-payment'),
    
    # Payment history and details
    path('/history', payment_views.payment_history, name='payment-history'),
    path('/transactions/<uuid:payment_id>', payment_views.payment_detail, name='payment-detail'),
    
    # Payment gateways
    path('/gateways', payment_views.get_payment_gateways, name='payment-gateways'),
    
    # Admin overview
    path('/admin/overview', payment_views.admin_payment_overview, name='admin-payment-overview'),
    
    # Test endpoint
    path('/test-student-registration', payment_views.test_student_registration, name='test-student-registration'),
]