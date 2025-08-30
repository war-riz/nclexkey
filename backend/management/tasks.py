# tasks.py
from celery import shared_task
from django.core.management import call_command
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from datetime import timedelta
from courses.models import Course, CourseAppeal, CourseEnrollment
from payments.models import Payment, InstructorPayout
from users.models import LoginAttempt, EmailLog
from payments.services import PayoutService, PaystackService
from utils.auth import EmailService
import logging
from django.contrib.auth import get_user_model

User = get_user_model()

logger = logging.getLogger(__name__)


@shared_task
def send_bulk_student_notifications(course_ids, notification_type, context_data):
    """Background task for sending bulk notifications to students"""
    try:
        courses = Course.objects.filter(id__in=course_ids)
        for course in courses:
            if notification_type == 'course_reactivated':
                EmailService.send_course_reactivation_to_students(course)
            elif notification_type == 'course_suspended':
                EmailService.send_course_suspension_to_students(
                    course, context_data.get('reason', '')
                )
        
        logger.info(f"Bulk {notification_type} notifications completed for {len(course_ids)} courses")
        return f"Successfully sent {notification_type} notifications for {len(course_ids)} courses"
    except Exception as e:
        logger.error(f"Bulk notification task failed: {str(e)}")
        raise

@shared_task
def send_instructor_status_notifications(instructor_id, action, reason, course_ids=None):
    """Background task for sending instructor status notifications"""
    try:
        instructor = User.objects.get(id=instructor_id)
        
        # Send instructor notification
        EmailService.send_instructor_status_notification(instructor, action, reason)
        
        # Send student notifications if courses are affected
        if course_ids:
            affected_courses = Course.objects.filter(id__in=course_ids)
            EmailService.send_instructor_status_change_to_students(
                instructor, action, affected_courses
            )
        
        return f"Notifications sent successfully for instructor {instructor.email}"
    except Exception as e:
        logger.error(f"Failed to send instructor notifications: {str(e)}")
        raise

@shared_task
def send_course_appeal_notifications(appeal_id):
    """Background task for sending appeal notifications"""
    try:
        appeal = CourseAppeal.objects.get(id=appeal_id)
        EmailService.send_course_appeal_notification(appeal)
        EmailService.send_appeal_confirmation_to_instructor(appeal)
        return f"Appeal notifications sent for appeal {appeal_id}"
    except Exception as e:
        logger.error(f"Failed to send appeal notifications: {str(e)}")
        raise

@shared_task(bind=True, max_retries=3)
def cleanup_old_records(self):
    """
    Celery task to clean up old records
    Run this daily via celery beat
    """
    try:
        call_command('cleanup_records', '--force')
        logger.info('Scheduled cleanup task completed successfully')
    except Exception as e:
        logger.error(f'Scheduled cleanup task failed: {str(e)}')
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60 * (2 ** self.request.retries), exc=e)
        raise

@shared_task(bind=True, max_retries=2)
def cleanup_expired_tokens(self):
    """
    Celery task to clean up expired tokens only
    Run this more frequently (every 6 hours)
    """
    from ..users.models import EmailVerificationToken, PasswordResetToken, RefreshToken
    
    try:
        now = timezone.now()
        cleanup_count = 0
        
        with transaction.atomic():
            # Clean expired verification tokens
            verification_count = EmailVerificationToken.objects.filter(
                expires_at__lt=now
            ).count()
            EmailVerificationToken.objects.filter(expires_at__lt=now).delete()
            
            # Clean expired reset tokens
            reset_count = PasswordResetToken.objects.filter(
                expires_at__lt=now
            ).count()
            PasswordResetToken.objects.filter(expires_at__lt=now).delete()
            
            # Clean expired refresh tokens
            refresh_count = RefreshToken.objects.filter(
                expires_at__lt=now
            ).count()
            RefreshToken.objects.filter(expires_at__lt=now).delete()
            
            cleanup_count = verification_count + reset_count + refresh_count
        
        logger.info(f'Token cleanup completed - removed {cleanup_count} expired tokens')
        
    except Exception as e:
        logger.error(f'Token cleanup failed: {str(e)}')
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=30 * (2 ** self.request.retries), exc=e)
        raise

@shared_task(bind=True, max_retries=3)
def process_scheduled_deletions(self):
    """
    Process users scheduled for deletion
    Run this daily - This is important for user privacy compliance
    """
    from ..users.models import User
    
    try:
        now = timezone.now()
        users_to_delete = User.objects.filter(
            is_deletion_pending=True,
            deletion_scheduled_for__lt=now
        )
        
        count = 0
        for user in users_to_delete:
            try:
                with transaction.atomic():
                    logger.info(f'Processing scheduled deletion for user: {user.email}')
                    # Send final deletion notification before deleting
                    try:
                        from ..utils.auth import EmailService
                        EmailService.send_account_deleted_email(user)
                    except Exception as email_error:
                        logger.warning(f'Failed to send deletion notification to {user.email}: {email_error}')
                    
                    user.delete()
                    count += 1
            except Exception as delete_error:
                logger.error(f'Failed to delete user {user.email}: {delete_error}')
                continue
        
        logger.info(f'Processed {count} scheduled account deletions')
        
    except Exception as e:
        logger.error(f'Scheduled deletion processing failed: {str(e)}')
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=120 * (2 ** self.request.retries), exc=e)
        raise

@shared_task(bind=True, max_retries=2)
def cleanup_inactive_sessions(self):
    """
    Clean up inactive user sessions
    Run this every 12 hours
    """
    from ..users.models import UserSession
    
    try:
        now = timezone.now()
        cutoff_date = now - timedelta(days=30)  # Sessions inactive for 30 days
        
        inactive_sessions = UserSession.objects.filter(
            last_activity__lt=cutoff_date,
            is_active=False
        )
        
        count = inactive_sessions.count()
        inactive_sessions.delete()
        
        logger.info(f'Cleaned up {count} inactive sessions')
        
    except Exception as e:
        logger.error(f'Session cleanup failed: {str(e)}')
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=e)
        raise

@shared_task(bind=True, max_retries=2)
def cleanup_old_login_attempts(self):
    """
    Clean up old login attempts
    Run this weekly
    """
    from ..users.models import LoginAttempt
    
    try:
        now = timezone.now()
        cutoff_date = now - timedelta(days=90)  # Keep 90 days of login attempts
        
        old_attempts = LoginAttempt.objects.filter(
            created_at__lt=cutoff_date
        )
        
        count = old_attempts.count()
        old_attempts.delete()
        
        logger.info(f'Cleaned up {count} old login attempts')
        
    except Exception as e:
        logger.error(f'Login attempts cleanup failed: {str(e)}')
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=e)
        raise

@shared_task(bind=True, max_retries=2)
def cleanup_old_email_logs(self):
    """
    Clean up old email logs (keep for audit purposes but not indefinitely)
    Run this monthly
    """
    from ..users.models import EmailLog
    
    try:
        now = timezone.now()
        cutoff_date = now - timedelta(days=180)  # Keep 6 months of email logs
        
        old_logs = EmailLog.objects.filter(
            sent_at__lt=cutoff_date
        )
        
        count = old_logs.count()
        old_logs.delete()
        
        logger.info(f'Cleaned up {count} old email logs')
        
    except Exception as e:
        logger.error(f'Email logs cleanup failed: {str(e)}')
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=e)
        raise
    

@shared_task(bind=True, max_retries=2)
def send_deletion_reminders(self):
    """
    Send reminders to users about pending account deletions
    Run this daily
    """
    from ..users.models import User
    
    try:
        now = timezone.now()
        
        # Users with deletion in 7 days
        reminder_date_7 = now + timedelta(days=7)
        users_7_days = User.objects.filter(
            is_deletion_pending=True,
            deletion_scheduled_for__date=reminder_date_7.date()
        )
        
        # Users with deletion in 1 day
        reminder_date_1 = now + timedelta(days=1)
        users_1_day = User.objects.filter(
            is_deletion_pending=True,
            deletion_scheduled_for__date=reminder_date_1.date()
        )
        
        try:
            from ..utils.auth import EmailService
            
            for user in users_7_days:
                EmailService.send_deletion_reminder(user, days_remaining=7)
            
            for user in users_1_day:
                EmailService.send_deletion_reminder(user, days_remaining=1)
                
        except Exception as email_error:
            logger.error(f'Failed to send deletion reminders: {email_error}')
        
        total_reminders = users_7_days.count() + users_1_day.count()
        logger.info(f'Sent {total_reminders} deletion reminder emails')
        
    except Exception as e:
        logger.error(f'Deletion reminder task failed: {str(e)}')
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=e)
        raise

@shared_task(bind=True, max_retries=1)
def database_health_check(self):
    """
    Perform database health checks and report anomalies
    Run this daily
    """
    from ..users.models import User, LoginAttempt, EmailLog
    from django.db import connection
    
    try:
        health_report = {}
        
        # Check for unusually high failed login attempts
        recent_failures = LoginAttempt.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=24),
            success=False
        ).count()
        
        if recent_failures > 1000:  # Threshold for concern
            health_report['high_failed_logins'] = recent_failures
        
        # Check for users with many failed attempts
        problematic_users = User.objects.filter(
            failed_login_attempts__gte=3
        ).count()
        
        if problematic_users > 100:  # Threshold for concern
            health_report['users_with_failed_attempts'] = problematic_users
        
        # Check email sending failures
        failed_emails = EmailLog.objects.filter(
            sent_at__gte=timezone.now() - timedelta(hours=24),
            success=False
        ).count()
        
        if failed_emails > 50:  # Threshold for concern
            health_report['failed_emails'] = failed_emails
        
        # Check database size (PostgreSQL specific)
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT pg_size_pretty(pg_database_size(current_database()));
            """)
            db_size = cursor.fetchone()[0]
            health_report['database_size'] = db_size
        
        if health_report:
            logger.warning(f'Database health check found issues: {health_report}')
        else:
            logger.info('Database health check passed')
        
    except Exception as e:
        logger.error(f'Database health check failed: {str(e)}')
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=300, exc=e)
        # Don't raise on final failure for health checks

@shared_task(bind=True, max_retries=2)
def send_weekly_admin_report(self):
    """Send weekly administrative report to super admins"""
    try:
        from django.db.models import Count, Sum
        from datetime import timedelta
        
        week_end = timezone.now()
        week_start = week_end - timedelta(days=7)
        
        # Collect statistics
        stats = {
            'new_users': User.objects.filter(
                created_at__gte=week_start,
                created_at__lt=week_end
            ).count(),
            
            'active_users': User.objects.filter(
                last_login__gte=week_start,
                is_active=True
            ).count(),
            
            'deleted_accounts': User.objects.filter(
                is_deletion_pending=True,
                deletion_scheduled_for__gte=week_start,
                deletion_scheduled_for__lt=week_end
            ).count(),
            
            'failed_logins': LoginAttempt.objects.filter(
                created_at__gte=week_start,
                success=False
            ).count(),
            
            'new_courses': Course.objects.filter(
                created_at__gte=week_start
            ).count(),
            
            'new_enrollments': CourseEnrollment.objects.filter(
                created_at__gte=week_start,
                payment_status='completed'
            ).count(),
            
            'pending_courses': Course.objects.filter(
                moderation_status='pending'
            ).count(),
            
            'new_appeals': CourseAppeal.objects.filter(
                created_at__gte=week_start
            ).count(),
            
            'failed_emails': EmailLog.objects.filter(
                sent_at__gte=week_start,
                success=False
            ).count(),
        }
        
        # Add financial data if Payment model exists
        try:
            stats.update({
                'total_revenue': Payment.objects.filter(
                    paid_at__gte=week_start,
                    status='completed'
                ).aggregate(total=Sum('amount'))['total'] or 0,
                
                'instructor_payouts': InstructorPayout.objects.filter(
                    created_at__gte=week_start,
                    status='completed'
                ).aggregate(total=Sum('net_payout'))['total'] or 0,
            })
        except:
            stats.update({'total_revenue': 0, 'instructor_payouts': 0})
        
        # Check for urgent items
        urgent_items = []
        if stats['failed_logins'] > 100:
            urgent_items.append(f"High failed login attempts: {stats['failed_logins']}")
        if stats['failed_emails'] > 20:
            urgent_items.append(f"Email delivery issues: {stats['failed_emails']}")
        if stats['pending_courses'] > 50:
            urgent_items.append(f"Many courses pending review: {stats['pending_courses']}")
        
        stats['urgent_items'] = urgent_items
        
        # Send to all super admins
        super_admins = User.objects.filter(role='super_admin', is_active=True)
        
        for admin in super_admins:
            EmailService.send_weekly_admin_report(admin, stats, week_start, week_end)
        
        logger.info(f"Weekly admin report sent to {super_admins.count()} administrators")
        
    except Exception as e:
        logger.error(f"Weekly admin report failed: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=300, exc=e)
        raise

@shared_task(bind=True, max_retries=2) 
def send_monthly_instructor_analytics(self):
    """Send monthly analytics to instructors"""
    try:
        from django.db.models import Count, Sum, Avg
        from datetime import timedelta
        
        # Get last month's data
        today = timezone.now().date()
        last_month_start = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
        last_month_end = today.replace(day=1) - timedelta(days=1)
        
        # Get all active instructors
        instructors = User.objects.filter(
            role='instructor',
            is_active=True,
            courses__isnull=False
        ).distinct()
        
        for instructor in instructors:
            try:
                # Calculate instructor's monthly stats
                earnings_data = {
                    'month_year': last_month_start.strftime('%B %Y'),
                    'instructor': instructor,
                    'total_sales': Payment.objects.filter(
                        course__created_by=instructor,
                        paid_at__gte=last_month_start,
                        paid_at__lte=last_month_end,
                        status='completed'
                    ).count(),
                    
                    'total_revenue': Payment.objects.filter(
                        course__created_by=instructor,
                        paid_at__gte=last_month_start,
                        paid_at__lte=last_month_end,
                        status='completed'
                    ).aggregate(total=Sum('amount'))['total'] or 0,
                    
                    'new_students': CourseEnrollment.objects.filter(
                        course__created_by=instructor,
                        created_at__gte=last_month_start,
                        created_at__lte=last_month_end,
                        payment_status='completed'
                    ).count(),
                }
                
                # Calculate instructor earnings (70% share)
                earnings_data['instructor_earnings'] = float(earnings_data['total_revenue']) * 0.70
                earnings_data['platform_fee'] = float(earnings_data['total_revenue']) * 0.30
                
                # Get top performing courses
                earnings_data['top_courses'] = Payment.objects.filter(
                    course__created_by=instructor,
                    paid_at__gte=last_month_start,
                    paid_at__lte=last_month_end,
                    status='completed'
                ).values(
                    'course__title', 'course__id'
                ).annotate(
                    sales=Count('id'),
                    revenue=Sum('amount')
                ).order_by('-revenue')[:5]
                
                # Send analytics email
                EmailService.send_monthly_earnings_summary(instructor, earnings_data)
                
            except Exception as instructor_error:
                logger.error(f"Failed to send analytics to {instructor.email}: {str(instructor_error)}")
                continue
        
        logger.info(f"Monthly analytics sent to {instructors.count()} instructors")
        
    except Exception as e:
        logger.error(f"Monthly instructor analytics failed: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=300, exc=e)
        raise

@shared_task(bind=True, max_retries=3)
def comprehensive_health_check(self):
    """Comprehensive system health check"""
    try:
        health_issues = []
        
        # Check database connections
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception as db_error:
            health_issues.append(f"Database connection issue: {str(db_error)}")
        
        # Check recent error rates
        recent_time = timezone.now() - timedelta(minutes=30)
        
        failed_logins = LoginAttempt.objects.filter(
            created_at__gte=recent_time,
            success=False
        ).count()
        
        if failed_logins > 50:  # Threshold for concern
            health_issues.append(f"High failed login rate: {failed_logins} in 30 minutes")
        
        # Check email delivery
        failed_emails = EmailLog.objects.filter(
            sent_at__gte=recent_time,
            success=False
        ).count()
        
        if failed_emails > 10:
            health_issues.append(f"Email delivery issues: {failed_emails} failures in 30 minutes")
        
        # Check payment processing
        try:
            failed_payments = Payment.objects.filter(
                initiated_at__gte=recent_time,
                status='failed'
            ).count()
            
            if failed_payments > 5:
                health_issues.append(f"Payment processing issues: {failed_payments} failures")
        except:
            pass
        
        # Alert if issues found
        if health_issues:
            super_admins = User.objects.filter(role='super_admin', is_active=True)
            
            alert_message = "System health issues detected:\n" + "\n".join(health_issues)
            
            for admin in super_admins:
                try:
                    EmailService.send_system_alert(admin, "System Health Alert", alert_message)
                except:
                    logger.error(f"Failed to send health alert to {admin.email}")
        
        logger.info(f"Health check complete. Issues found: {len(health_issues)}")
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=e)