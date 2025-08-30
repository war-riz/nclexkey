# payments/serializers.py
from rest_framework import serializers
from .models import PaymentRefund, Payment, PaymentGateway


class PaymentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_id = serializers.CharField(source='course.id', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    gateway_name = serializers.CharField(source='gateway.display_name', read_only=True)
    formatted_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'reference', 'amount', 'currency', 'status',
            'gateway_name', 'payment_method', 'initiated_at', 'paid_at',
            'course_title', 'course_id', 'user_name', 'user_email', 
            'gateway_fee', 'platform_fee', 'net_amount', 'formatted_amount',
            'failure_reason', 'customer_email', 'customer_name'
        ]
        read_only_fields = [
            'id', 'reference', 'initiated_at', 'gateway_fee', 
            'platform_fee', 'net_amount', 'formatted_amount'
        ]
    
    def get_formatted_amount(self, obj):
        """Get formatted amount with currency symbol"""
        return obj.get_formatted_amount()


class RefundSerializer(serializers.ModelSerializer):
    payment_reference = serializers.CharField(source='payment.reference', read_only=True)
    payment_amount = serializers.DecimalField(source='payment.amount', max_digits=12, decimal_places=2, read_only=True)
    course_title = serializers.CharField(source='payment.course.title', read_only=True)
    gateway_name = serializers.CharField(source='payment.gateway.display_name', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    currency = serializers.CharField(source='payment.currency', read_only=True)
    formatted_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentRefund
        fields = [
            'id', 'reference', 'amount', 'reason', 'status', 
            'payment_reference', 'payment_amount', 'course_title', 
            'gateway_name', 'user_name', 'user_email', 'currency',
            'formatted_amount', 'requested_at', 'processed_at',
            'completed_at', 'failure_reason', 'admin_notes',
            'gateway_reference'
        ]
        read_only_fields = [
            'id', 'reference', 'status', 'processed_at', 'completed_at', 
            'failure_reason', 'admin_notes', 'gateway_reference',
            'payment_reference', 'payment_amount', 'course_title',
            'gateway_name', 'user_name', 'user_email', 'currency',
            'formatted_amount'
        ]
    
    def get_formatted_amount(self, obj):
        """Get formatted refund amount with currency symbol"""
        symbols = {
            'NGN': '₦',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'GHS': 'GH₵',
            'KES': 'KSh',
            'ZAR': 'R'
        }
        currency = obj.payment.currency
        symbol = symbols.get(currency, currency)
        return f"{symbol}{obj.amount:,.2f}"


class PaymentGatewaySerializer(serializers.ModelSerializer):
    """Serializer for payment gateway info (public data only)"""
    
    class Meta:
        model = PaymentGateway
        fields = [
            'id', 'name', 'display_name', 'is_active', 
            'supported_currencies', 'transaction_fee_percentage'
        ]
        read_only_fields = ['id']


class AdminPaymentSerializer(PaymentSerializer):
    """Extended payment serializer for admin views"""
    instructor_name = serializers.CharField(source='course.created_by.full_name', read_only=True)
    instructor_email = serializers.CharField(source='course.created_by.email', read_only=True)
    gateway_response = serializers.JSONField(read_only=True)
    ip_address = serializers.IPAddressField(read_only=True)
    
    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + [
            'instructor_name', 'instructor_email', 'gateway_response',
            'ip_address', 'user_agent', 'authorization_code',
            'card_type', 'last_4_digits', 'bank'
        ]


class AdminRefundSerializer(RefundSerializer):
    """Extended refund serializer for admin views"""
    processed_by_name = serializers.CharField(source='processed_by.full_name', read_only=True)
    instructor_name = serializers.CharField(source='payment.course.created_by.full_name', read_only=True)
    instructor_email = serializers.CharField(source='payment.course.created_by.email', read_only=True)
    
    class Meta(RefundSerializer.Meta):
        fields = RefundSerializer.Meta.fields + [
            'processed_by_name', 'instructor_name', 'instructor_email'
        ]