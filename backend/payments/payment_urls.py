# payments/payment_urls.py
from django.urls import path
from . import payment_views, bank_transfer

urlpatterns = [
    # Student payment operations
    path('transactions/', payment_views.payment_history, name='payment_history'),
    path('transactions/<uuid:payment_id>/', payment_views.payment_detail, name='payment_detail'),

    # Bank Transfer for Students
    path('bank-transfer/<uuid:course_id>/initiate/', bank_transfer.initiate_bank_transfer_payment, name='initiate-bank-transfer'),
    path('bank-transfer/<str:payment_reference>/status/', bank_transfer.check_bank_transfer_status, name='check-bank-transfer-status'),
    
    # Platform manager payment operations
    path('admin/overview/', payment_views.admin_payment_overview, name='admin_payment_overview'),
]