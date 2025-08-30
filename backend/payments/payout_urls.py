# payments/payout_urls.py
from django.urls import path, include
from . import payout_views

urlpatterns = [
     # Super admin payout management
    path('admin/pending-payouts/', payout_views.pending_payouts, name='admin-pending-payouts'),
    path('admin/process-payout/<uuid:payout_id>/', payout_views.process_payout_request, name='admin-process-payout'),
    path('admin/payouts/bulk-process/', payout_views.bulk_process_payouts, name='admin-bulk-process-payouts'),

    path('instructor/earning-summary/', payout_views.instructor_earnings, name='earning-summary'),
]