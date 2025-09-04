# messaging/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

class Conversation(models.Model):
    """Conversation between users for direct messaging"""
    
    CONVERSATION_TYPES = (
        ('instructor', 'Student-Instructor'),
        ('support', 'Support Request'),
        ('general', 'General Inquiry'),
        ('course', 'Course Related'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation_type = models.CharField(max_length=20, choices=CONVERSATION_TYPES, default='general')
    
    # Participants
    participants = models.ManyToManyField(User, related_name='conversations')
    
    # Conversation details
    subject = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    
    # Optional course reference
    related_course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'messaging_conversations'
        ordering = ['-last_message_at', '-created_at']
        indexes = [
            models.Index(fields=['conversation_type']),
            models.Index(fields=['is_active']),
            models.Index(fields=['last_message_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.subject} ({self.get_conversation_type_display()})"
    
    def get_other_participant(self, current_user):
        """Get the other participant in a 1-on-1 conversation"""
        other_participants = self.participants.exclude(id=current_user.id)
        return other_participants.first()
    
    def update_last_message_time(self):
        """Update the last message timestamp"""
        self.last_message_at = timezone.now()
        self.save(update_fields=['last_message_at'])

class ConversationMessage(models.Model):
    """Individual messages within a conversation"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_conversation_messages'
    )
    
    # Message content
    content = models.TextField()
    
    # Message status
    is_read = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'messaging_conversation_messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation']),
            models.Index(fields=['sender']),
            models.Index(fields=['is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.email} in {self.conversation.subject}"
    
    def mark_as_read(self):
        """Mark message as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
            # Update conversation last message time
            self.conversation.update_last_message_time()

class Message(models.Model):
    """Internal messaging system for platform communication"""
    
    MESSAGE_TYPES = (
        ('system', 'System Notification'),
        ('admin', 'Admin Message'),
        ('instructor', 'Instructor Message'),
        ('student', 'Student Message'),
        ('support', 'Support Request'),
        ('announcement', 'Platform Announcement'),
    )
    
    PRIORITY_LEVELS = (
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='admin')
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='normal')
    
    # Message content
    subject = models.CharField(max_length=255)
    content = models.TextField()
    
    # Sender and recipients
    sender = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='sent_messages'
    )
    recipients = models.ManyToManyField(
        User, 
        related_name='received_messages',
        blank=True
    )
    
    # Message metadata
    is_read = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Optional attachments or references
    related_course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='messages'
    )
    
    # Reply chain
    parent_message = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    
    class Meta:
        db_table = 'messaging_messages'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender']),
            models.Index(fields=['message_type']),
            models.Index(fields=['priority']),
            models.Index(fields=['is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.subject} - {self.sender.email}"
    
    def mark_as_read(self, user):
        """Mark message as read by specific user"""
        if user in self.recipients.all():
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def get_unread_count(self, user):
        """Get unread message count for a user"""
        return Message.objects.filter(
            recipients=user,
            is_read=False,
            is_deleted=False
        ).count()

class MessageThread(models.Model):
    """Thread for organizing related messages"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    participants = models.ManyToManyField(User, related_name='message_threads')
    last_message = models.ForeignKey(
        Message,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='thread'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'messaging_threads'
        ordering = ['-updated_at']
    
    def __str__(self):
        return self.title

class Notification(models.Model):
    """System notifications for users"""
    
    NOTIFICATION_TYPES = (
        ('course_approved', 'Course Approved'),
        ('course_rejected', 'Course Rejected'),
        ('new_enrollment', 'New Enrollment'),
        ('payment_received', 'Payment Received'),
        ('exam_result', 'Exam Result'),
        ('system_alert', 'System Alert'),
        ('announcement', 'Platform Announcement'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    # Notification content
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Metadata
    is_read = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    
    # Related data (optional)
    related_url = models.URLField(blank=True, null=True)
    related_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'messaging_notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
