# messaging/serializers.py
from rest_framework import serializers
from .models import Message, MessageThread, Notification, Conversation, ConversationMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for messaging"""
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role']

class ConversationMessageSerializer(serializers.ModelSerializer):
    """Serializer for conversation messages"""
    sender = UserSerializer(read_only=True)
    sender_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = ConversationMessage
        fields = [
            'id', 'conversation', 'sender', 'sender_id', 'content',
            'is_read', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sender', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set sender from authenticated user
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)

class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversations"""
    participants = UserSerializer(many=True, read_only=True)
    participant_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True
    )
    last_message = ConversationMessageSerializer(read_only=True)
    other_participant = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'conversation_type', 'participants', 'participant_ids',
            'subject', 'is_active', 'related_course', 'created_at',
            'updated_at', 'last_message_at', 'last_message',
            'other_participant', 'unread_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_message_at']
    
    def get_other_participant(self, obj):
        """Get the other participant in the conversation"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return UserSerializer(obj.get_other_participant(request.user)).data
        return None
    
    def get_unread_count(self, obj):
        """Get unread message count for current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(
                is_read=False,
                is_deleted=False
            ).exclude(sender=request.user).count()
        return 0
    
    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        conversation = Conversation.objects.create(**validated_data)
        
        # Add participants
        participants = User.objects.filter(id__in=participant_ids)
        conversation.participants.add(*participants)
        
        return conversation

class MessageSerializer(serializers.ModelSerializer):
    """Serializer for internal messages"""
    sender = UserSerializer(read_only=True)
    recipients = UserSerializer(many=True, read_only=True)
    recipient_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True
    )
    
    class Meta:
        model = Message
        fields = [
            'id', 'message_type', 'priority', 'subject', 'content',
            'sender', 'recipients', 'recipient_ids', 'is_read',
            'is_archived', 'is_deleted', 'related_course',
            'parent_message', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sender', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        recipient_ids = validated_data.pop('recipient_ids', [])
        message = Message.objects.create(**validated_data)
        
        # Add recipients
        recipients = User.objects.filter(id__in=recipient_ids)
        message.recipients.add(*recipients)
        
        return message

class MessageThreadSerializer(serializers.ModelSerializer):
    """Serializer for message threads"""
    participants = UserSerializer(many=True, read_only=True)
    last_message = MessageSerializer(read_only=True)
    
    class Meta:
        model = MessageThread
        fields = [
            'id', 'title', 'participants', 'last_message',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'is_read', 'is_dismissed', 'related_url', 'related_id',
            'created_at', 'read_at'
        ]
        read_only_fields = ['id', 'created_at']

class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new messages"""
    
    recipient_emails = serializers.ListField(
        child=serializers.EmailField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Message
        fields = [
            'message_type', 'priority', 'subject', 'content',
            'recipient_emails', 'related_course', 'parent_message'
        ]
    
    def create(self, validated_data):
        recipient_emails = validated_data.pop('recipient_emails', [])
        
        # Get current user as sender
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['sender'] = request.user
        
        # Create message
        message = Message.objects.create(**validated_data)
        
        # Add recipients by email
        if recipient_emails:
            from users.models import User
            recipients = User.objects.filter(email__in=recipient_emails)
            message.recipients.set(recipients)
        
        return message

class BulkMessageSerializer(serializers.Serializer):
    """Serializer for sending bulk messages"""
    
    message_type = serializers.ChoiceField(choices=Message.MESSAGE_TYPES)
    priority = serializers.ChoiceField(choices=Message.PRIORITY_LEVELS, default='normal')
    subject = serializers.CharField(max_length=255)
    content = serializers.CharField()
    
    # Target options
    target_all_users = serializers.BooleanField(default=False)
    target_instructors = serializers.BooleanField(default=False)
    target_students = serializers.BooleanField(default=False)
    target_specific_users = serializers.ListField(
        child=serializers.EmailField(),
        required=False
    )
    
    # Course-specific targeting
    target_course_enrollments = serializers.UUIDField(required=False)
    
    def validate(self, data):
        """Validate that at least one target is selected"""
        has_target = (
            data.get('target_all_users') or
            data.get('target_instructors') or
            data.get('target_students') or
            data.get('target_specific_users') or
            data.get('target_course_enrollments')
        )
        
        if not has_target:
            raise serializers.ValidationError(
                "At least one target must be selected"
            )
        
        return data
