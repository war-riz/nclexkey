# users/urls.py
from django.urls import path, include

urlpatterns = [
    # Authentication endpoints
    path('api/auth/', include('users.auth_urls')),
]