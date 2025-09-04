# payments/urls.py
from django.urls import path
from . import payment_views

app_name = 'payments'

urlpatterns = [
    path('simple-test/', payment_views.simple_test, name='simple_test'),
    path('debug/', payment_views.debug_payment_endpoint, name='debug_payment_endpoint'),
    path('initialize/', payment_views.initialize_payment, name='initialize_payment'),
    path('verify/<str:reference>/', payment_views.verify_payment, name='verify_payment'),
    path('overview/', payment_views.admin_payment_overview, name='admin_payment_overview'),
    path('test-student-registration/', payment_views.test_student_registration_payment, name='test_student_registration_payment'),
]