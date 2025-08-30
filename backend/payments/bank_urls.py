# payments/bank_urls.py
from django.urls import path, include
from . import bank_views

urlpatterns = [
    # Bank account management
    path('banks/', bank_views.get_banks, name='get_banks'),
    path('instructor/bank-account/', bank_views.instructor_bank_account, name='instructor_bank_account'),
    path('instructor/bank-account/verify/', bank_views.verify_bank_account, name='verify_bank_account'),
    path('instructor/bank-account/toggle-auto-payout/', bank_views.toggle_auto_payout, name='toggle_auto_payout'),
    path('instructor/payout-history/', bank_views.payout_history, name='payout_history'),
    path('instructor/bank-account/summary/', bank_views.bank_account_summary, name='bank_account_summary'),
    path('instructor/bank-account/delete/', bank_views.delete_bank_account, name='delete_bank_account'),
    path('instructor/refund-impact/', bank_views.instructor_refund_impact, name='instructor-refund-impact'),
]