# payments/tasks.py
from celery import shared_task
from django.core.management import call_command
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from datetime import timedelta
from courses.models import Course, CourseAppeal, CourseEnrollment
from payments.models import Payment, InstructorPayout
from payments.services import PayoutService, PaystackService
from utils.auth import EmailService
import logging
from django.contrib.auth import get_user_model

User = get_user_model()

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2)
def send_progress_reminders(self):
    """Send progress reminders to inactive students"""
    try:
        from django.db.models import Avg, F, Case, When
        
        # Find students with incomplete courses who haven't accessed them recently
        inactive_threshold = timezone.now() - timedelta(days=7)
        
        inactive_enrollments = CourseEnrollment.objects.filter(
            is_active=True,
            payment_status='completed',
            progress_percentage__lt=100,
            last_accessed__lt=inactive_threshold
        ).select_related('user', 'course')
        
        # Group by user to send one email per student
        students_data = {}
        for enrollment in inactive_enrollments:
            user_id = enrollment.user.id
            if user_id not in students_data:
                students_data[user_id] = {
                    'user': enrollment.user,
                    'courses': []
                }
            students_data[user_id]['courses'].append({
                'title': enrollment.course.title,
                'progress_percentage': enrollment.progress_percentage,
                'last_accessed': enrollment.last_accessed,
                'next_lesson_title': 'Continue Learning',  # You can enhance this
                'continue_url': f"{settings.FRONTEND_URL}/courses/{enrollment.course.id}"
            })
        
        # Send reminders
        for student_data in students_data.values():
            try:
                avg_progress = sum([c['progress_percentage'] for c in student_data['courses']]) / len(student_data['courses'])
                
                EmailService.send_progress_reminder(
                    student_data['user'], 
                    student_data['courses'],
                    avg_progress
                )
            except Exception as e:
                logger.error(f"Failed to send progress reminder to {student_data['user'].email}: {str(e)}")
        
        logger.info(f"Progress reminders sent to {len(students_data)} students")
        
    except Exception as e:
        logger.error(f"Progress reminder task failed: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=300, exc=e)