# users/auth_urls.py
from django.urls import path
from . import auth_views

urlpatterns = [
    # Basic Authentication
    path('register/', auth_views.register, name='register'),
    path('login/', auth_views.login_view, name='login'),
    path('instructor/login/', auth_views.instructor_login, name='instructor_login'),
    path('logout/', auth_views.logout, name='logout'),
    
    # User Profile
    path('profile/', auth_views.get_user_profile, name='get_user_profile'),
    path('profile/update/', auth_views.update_profile, name='update_profile'),
    
    # User Management
    path('instructors/', auth_views.get_instructors, name='get_instructors'),
    
    # Development endpoints
    path('test-rate-limiting/', auth_views.test_rate_limiting, name='test_rate_limiting'),
    path('clear-rate-limit/', auth_views.clear_rate_limit_cache, name='clear_rate_limit_cache'),
]