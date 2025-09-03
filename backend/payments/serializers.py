# payments/serializers.py
from rest_framework import serializers
from .models import Payment, PaymentGateway


class PaymentGatewaySerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentGateway
        fields = ['id', 'name', 'display_name', 'is_active', 'is_default', 'supported_currencies']


class PaymentSerializer(serializers.ModelSerializer):
    gateway = PaymentGatewaySerializer(read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'reference', 'gateway', 'gateway_reference', 'user', 'course',
            'amount', 'currency', 'status', 'metadata', 'created_at', 'updated_at',
            'completed_at', 'course_title', 'user_email'
        ]
        read_only_fields = ['id', 'reference', 'gateway_reference', 'created_at', 'updated_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['course', 'amount', 'currency', 'metadata']

