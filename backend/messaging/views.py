# messaging/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, Count, Max
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .models import Message, MessageThread, Notification, Conversation, ConversationMessage
from .serializers import (
    MessageSerializer, MessageThreadSerializer, NotificationSerializer,
    ConversationSerializer, ConversationMessageSerializer
)
from courses.models import Course
from common.permissions import IsAdmin
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

# --- CONVERSATION VIEWS ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    """Get all conversations for the authenticated user"""
    try:
        user = request.user
        conversations = Conversation.objects.filter(
            participants=user,
            is_active=True
        ).prefetch_related('participants', 'messages').order_by('-last_message_at', '-created_at')
        
        # Add last message to each conversation
        for conversation in conversations:
            last_message = conversation.messages.order_by('-created_at').first()
            if last_message:
                conversation.last_message = last_message
        
        serializer = ConversationSerializer(conversations, many=True, context={'request': request})
        return Response({
            'success': True,
            'data': {
                'conversations': serializer.data
            }
        })
    except Exception as e:
        logger.error(f"Error getting conversations: {str(e)}")
        return Response({
            'success': False,
            'error': {'message': 'Failed to load conversations'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation(request, conversation_id):
    """Get a specific conversation"""
    try:
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response({
            'success': True,
            'data': {
                'conversation': serializer.data
            }
        })
    except Exception as e:
        logger.error(f"Error getting conversation {conversation_id}: {str(e)}")
        return Response({
            'success': False,
            'error': {'message': 'Failed to load conversation'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_conversation(request):
    """Create a new conversation"""
    try:
        user = request.user
        data = request.data
        
        # Validate required fields
        if not data.get('subject') or not data.get('initial_message'):
            return Response({
                'success': False,
                'error': {'message': 'Subject and initial message are required'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine participants based on conversation type
        participant_ids = [user.id]
        
        if data.get('conversation_type') == 'instructor' and data.get('instructor_id'):
            # Add instructor to participants
            try:
                instructor = User.objects.get(id=data['instructor_id'], role='instructor')
                participant_ids.append(instructor.id)
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'error': {'message': 'Instructor not found'}
                }, status=status.HTTP_404_NOT_FOUND)
        elif data.get('conversation_type') == 'support':
            # Add support/admin users
            support_users = User.objects.filter(role='admin')[:1]
            if support_users:
                participant_ids.append(support_users[0].id)
        
        # Create conversation
        conversation_data = {
            'conversation_type': data.get('conversation_type', 'general'),
            'subject': data['subject'],
            'related_course_id': data.get('course_id'),
            'participant_ids': participant_ids
        }
        
        serializer = ConversationSerializer(data=conversation_data, context={'request': request})
        if serializer.is_valid():
            conversation = serializer.save()
            
            # Create initial message
            message_data = {
                'conversation': conversation.id,
                'content': data['initial_message']
            }
            
            message_serializer = ConversationMessageSerializer(data=message_data, context={'request': request})
            if message_serializer.is_valid():
                message = message_serializer.save()
                conversation.update_last_message_time()
                
                # Return conversation with message
                conversation_serializer = ConversationSerializer(conversation, context={'request': request})
                return Response({
                    'success': True,
                    'data': {
                        'conversation': conversation_serializer.data
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                # Delete conversation if message creation fails
                conversation.delete()
                return Response({
                    'success': False,
                    'error': {'message': 'Failed to create initial message'}
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                'success': False,
                'error': {'message': 'Invalid conversation data', 'details': serializer.errors}
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        return Response({
            'success': False,
            'error': {'message': 'Failed to create conversation'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, conversation_id):
    """Get messages for a conversation"""
    try:
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        messages = conversation.messages.filter(is_deleted=False).order_by('created_at')
        
        serializer = ConversationMessageSerializer(messages, many=True, context={'request': request})
        return Response({
            'success': True,
            'data': {
                'messages': serializer.data
            }
        })
    except Exception as e:
        logger.error(f"Error getting messages for conversation {conversation_id}: {str(e)}")
        return Response({
            'success': False,
            'error': {'message': 'Failed to load messages'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, conversation_id):
    """Send a message in a conversation"""
    try:
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        
        if not request.data.get('content'):
            return Response({
                'success': False,
                'error': {'message': 'Message content is required'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        message_data = {
            'conversation': conversation.id,
            'content': request.data['content']
        }
        
        serializer = ConversationMessageSerializer(data=message_data, context={'request': request})
        if serializer.is_valid():
            message = serializer.save()
            conversation.update_last_message_time()
            
            return Response({
                'success': True,
                'data': {
                    'message': ConversationMessageSerializer(message, context={'request': request}).data
                }
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'error': {'message': 'Invalid message data', 'details': serializer.errors}
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error sending message in conversation {conversation_id}: {str(e)}")
        return Response({
            'success': False,
            'error': {'message': 'Failed to send message'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_conversation_read(request, conversation_id):
    """Mark all messages in a conversation as read"""
    try:
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        user = request.user
        
        # Mark all unread messages as read
        unread_messages = conversation.messages.filter(
            is_read=False,
            is_deleted=False
        ).exclude(sender=user)
        
        for message in unread_messages:
            message.mark_as_read()
        
        return Response({
            'success': True,
            'message': 'Conversation marked as read'
        })
    except Exception as e:
        logger.error(f"Error marking conversation {conversation_id} as read: {str(e)}")
        return Response({
            'success': False,
            'error': {'message': 'Failed to mark conversation as read'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    """Get unread message count for the user"""
    try:
        user = request.user
        
        # Get unread counts for conversations
        conversations = Conversation.objects.filter(participants=user, is_active=True)
        conversation_counts = []
        total_unread = 0
        
        for conversation in conversations:
            unread_count = conversation.messages.filter(
                is_read=False,
                is_deleted=False
            ).exclude(sender=user).count()
            
            if unread_count > 0:
                conversation_counts.append({
                    'conversation_id': conversation.id,
                    'unread_count': unread_count
                })
                total_unread += unread_count
        
        return Response({
            'success': True,
            'data': {
                'total_unread': total_unread,
                'conversation_counts': conversation_counts
            }
        })
    except Exception as e:
        logger.error(f"Error getting unread count: {str(e)}")
        return Response({
            'success': False,
            'error': {'message': 'Failed to get unread count'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- LEGACY MESSAGE VIEWS (keeping for backward compatibility) ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages_legacy(request):
    """Get all messages for the authenticated user (legacy)"""
    try:
        user = request.user
        messages = Message.objects.filter(
            Q(sender=user) | Q(recipients=user),
            is_deleted=False
        ).order_by('-created_at')
        
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response({
            'success': True,
            'data': {
                'messages': serializer.data
            }
        })
    except Exception as e:
        logger.error(f"Error getting messages: {str(e)}")
        return Response({
            'success': False,
            'error': {'message': 'Failed to load messages'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message_legacy(request):
    """Send a message (legacy)"""
    try:
        data = request.data
        data['sender'] = request.user.id
        
        serializer = MessageSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            message = serializer.save()
            return Response({
                'success': True,
                'data': {
                    'message': MessageSerializer(message, context={'request': request}).data
                }
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'error': {'message': 'Invalid message data', 'details': serializer.errors}
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        return Response({
            'success': False,
            'error': {'message': 'Failed to send message'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- NOTIFICATION VIEWS ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """Get notifications for the authenticated user"""
    try:
        user = request.user
        notifications = Notification.objects.filter(
            user=user,
            is_dismissed=False
        ).order_by('-created_at')
        
        serializer = NotificationSerializer(notifications, many=True)
        return Response({
            'success': True,
            'data': {
                'notifications': serializer.data
            }
        })
    except Exception as e:
        logger.error(f"Error getting notifications: {str(e)}")
        return Response({
            'success': False,
            'error': {'message': 'Failed to load notifications'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    try:
        notification = get_object_or_404(Notification, id=notification_id, user=request.user)
        notification.mark_as_read()
        
        return Response({
            'success': True,
            'message': 'Notification marked as read'
        })
    except Exception as e:
        logger.error(f"Error marking notification {notification_id} as read: {str(e)}")
        return Response({
            'success': False,
            'error': {'message': 'Failed to mark notification as read'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdmin])
def get_messaging_analytics(request):
    """
    Get messaging analytics for admin dashboard
    GET /api/messaging/analytics/
    """
    try:
        # Date range filters
        days = int(request.GET.get('days', 30))
        start_date = timezone.now() - timezone.timedelta(days=days)
        
        # Message statistics
        total_messages = Message.objects.filter(created_at__gte=start_date).count()
        system_messages = Message.objects.filter(
            message_type='system',
            created_at__gte=start_date
        ).count()
        admin_messages = Message.objects.filter(
            message_type='admin',
            created_at__gte=start_date
        ).count()
        
        # Notification statistics
        total_notifications = Notification.objects.filter(created_at__gte=start_date).count()
        unread_notifications = Notification.objects.filter(
            is_read=False,
            is_dismissed=False
        ).count()
        
        # User engagement
        active_users = User.objects.filter(
            received_messages__created_at__gte=start_date
        ).distinct().count()
        
        # Message types breakdown
        message_types = Message.objects.filter(
            created_at__gte=start_date
        ).values('message_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        analytics_data = {
            'period_days': days,
            'messages': {
                'total_messages': total_messages,
                'system_messages': system_messages,
                'admin_messages': admin_messages,
                'message_types_breakdown': list(message_types)
            },
            'notifications': {
                'total_notifications': total_notifications,
                'unread_notifications': unread_notifications
            },
            'engagement': {
                'active_users': active_users
            }
        }
        
        return Response(analytics_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Messaging analytics error: {str(e)}")
        return Response(
            {'detail': 'Failed to fetch messaging analytics.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
