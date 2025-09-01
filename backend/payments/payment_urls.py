# payments/payment_urls.py
from django.urls import path
from . import payment_views, bank_transfer

urlpatterns = [
    # Payment initialization (frontend calls this)
    path('initialize/', payment_views.initialize_payment, name='initialize_payment'),
    
    # Test student registration endpoint
    path('test-student-registration/', payment_views.test_student_registration, name='test_student_registration'),
    
    # Payment verification
    path('verify/<str:reference>/', payment_views.verify_payment, name='verify_payment'),
    
    # Payment gateways
    path('gateways/', payment_views.get_payment_gateways, name='get_payment_gateways'),
    
    # Student payment operations
    path('transactions/', payment_views.payment_history, name='payment_history'),
    path('transactions/<uuid:payment_id>/', payment_views.payment_detail, name='payment_detail'),

    # Bank Transfer for Students
    path('bank-transfer/<uuid:course_id>/initiate/', bank_transfer.initiate_bank_transfer_payment, name='initiate-bank-transfer'),
    path('bank-transfer/<str:payment_reference>/status/', bank_transfer.check_bank_transfer_status, name='check-bank-transfer-status'),
    
    # Platform manager payment operations
    path('admin/overview/', payment_views.admin_payment_overview, name='admin_payment_overview'),
]