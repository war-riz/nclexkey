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

@shared_task
def create_monthly_payouts_task():
    """Run monthly payout calculation"""
    try:
        payouts = PayoutService.create_monthly_payouts()
        logger.info(f"Created {len(payouts)} monthly payouts")
        return f"Success: {len(payouts)} payouts created"
    except Exception as e:
        logger.error(f"Monthly payout creation failed: {str(e)}")
        return f"Failed: {str(e)}"

@shared_task  
def process_auto_payouts():
    """Auto-process eligible payouts for instructors with verified bank accounts"""

    # Only process payouts for instructors with verified bank accounts and auto-payout enabled
    pending_payouts = InstructorPayout.objects.filter(
        status='pending',
        net_payout__gte=1000.00,  # Minimum threshold (1,000 NGN as you mentioned)
        instructor__bank_account__is_verified=True,
        instructor__bank_account__auto_payout_enabled=True
    ).select_related('instructor', 'instructor__bank_account')
    
    processed = 0
    failed = 0
    
    for payout in pending_payouts:
        try:
            # Additional eligibility check
            if payout.is_eligible_for_payout():
                result = PayoutService.process_payout(payout.id, auto_process=True)
                if result['success']:
                    processed += 1
                    logger.info(f"Auto-processed payout: {payout.instructor.email} - {payout.net_payout}")
                else:
                    failed += 1
                    logger.warning(f"Auto-payout failed: {payout.instructor.email} - {result['message']}")
            else:
                logger.info(f"Payout not eligible: {payout.instructor.email}")
                
        except Exception as e:
            failed += 1
            logger.error(f"Auto-payout error for {payout.instructor.email}: {str(e)}")
    
    return f"Auto-processed {processed} payouts, {failed} failed"

@shared_task
def process_monthly_payouts():
    """Celery task to process monthly payouts"""
    try:
        created_payouts = PayoutService.create_monthly_payouts()
        logger.info(f"Created {len(created_payouts)} monthly payouts")
        
        # Auto-process small amounts
        auto_processed = 0
        for payout in created_payouts:
            if payout.net_payout <= 10000:  # 10k NGN limit
                result = PayoutService.process_payout(payout.id, auto_process=True)
                if result['success']:
                    auto_processed += 1
        
        logger.info(f"Auto-processed {auto_processed} small payouts")
        return f"Created {len(created_payouts)} payouts, auto-processed {auto_processed}"
        
    except Exception as e:
        logger.error(f"Monthly payout processing error: {str(e)}")
        raise e
    
@shared_task
def cleanup_expired_payments():
    """Clean up expired pending payments"""
    try:        
        # Find payments older than 24 hours
        expiry_time = timezone.now() - timedelta(hours=24)
        
        expired_payments = Payment.objects.filter(
            status='pending',
            initiated_at__lt=expiry_time
        )
        
        expired_enrollments = CourseEnrollment.objects.filter(
            payment_status='pending',
            created_at__lt=expiry_time
        )
        
        expired_count = expired_payments.count()
        enrollment_count = expired_enrollments.count()
        
        # Mark as cancelled
        expired_payments.update(
            status='cancelled',
            failure_reason='Payment expired'
        )
        
        # Cancel enrollments
        expired_enrollments.delete()
        
        logger.info(f"Cleaned up {expired_count} expired payments and {enrollment_count} enrollments")
        return f"Cleaned up {expired_count} payments, {enrollment_count} enrollments"
        
    except Exception as e:
        logger.error(f"Payment cleanup error: {str(e)}")
        raise e


@shared_task
def verify_pending_bank_transfers():
    """Check for bank transfer payments that may have been completed"""
    try:    
        # Get bank transfer payments that are still pending (less than 48 hours old)
        pending_transfers = Payment.objects.filter(
            payment_method='bank_transfer',
            status='pending',
            initiated_at__gte=timezone.now() - timedelta(hours=48)
        )
        
        verified_count = 0
        paystack_service = PaystackService()
        
        for payment in pending_transfers:
            try:
                result = paystack_service.verify_payment(payment.reference)
                
                if result['success'] and result['verified']:
                    if result['status'] == 'success':
                        # Complete the payment
                        from payments.bank_transfer import complete_bank_transfer_payment
                        complete_bank_transfer_payment(payment, result)
                        verified_count += 1
                        logger.info(f"Bank transfer verified: {payment.reference}")
                        
            except Exception as e:
                logger.warning(f"Error verifying bank transfer {payment.reference}: {str(e)}")
                continue
        
        logger.info(f"Verified {verified_count} bank transfers")
        return f"Verified {verified_count} bank transfers"
        
    except Exception as e:
        logger.error(f"Bank transfer verification error: {str(e)}")
        raise e
    
@shared_task(bind=True, max_retries=2)
def send_payout_reminders(self):
    """Send payout reminders to instructors"""
    try:
        # Find instructors with pending payouts
        pending_payouts = InstructorPayout.objects.filter(
            status='pending',
            created_at__lt=timezone.now() - timedelta(days=5)  # 5 days old
        ).select_related('instructor')
        
        reminder_count = 0
        
        for payout in pending_payouts:
            try:
                context = {
                    'instructor_name': payout.instructor.full_name,
                    'payout_amount': payout.net_payout,
                    'period': f"{payout.period_start.strftime('%B %d')} - {payout.period_end.strftime('%B %d, %Y')}",
                    'pending_days': (timezone.now().date() - payout.created_at.date()).days,
                    'dashboard_url': f"{settings.FRONTEND_URL}/instructor/earnings"
                }
                
                # Send reminder email (you'll need to create this template)
                EmailService.send_payout_reminder(payout.instructor, context)
                reminder_count += 1
                
            except Exception as payout_error:
                logger.error(f"Failed to send payout reminder to {payout.instructor.email}: {str(payout_error)}")
                continue
        
        logger.info(f"Payout reminders sent: {reminder_count}")
        
    except Exception as e:
        logger.error(f"Payout reminder task failed: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=300, exc=e)