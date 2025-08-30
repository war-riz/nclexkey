# payments/management/commands/cleanup_expired_payments.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from payments.models import Payment
from courses.models import CourseEnrollment

class Command(BaseCommand):
    help = 'Clean up expired pending payments'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Hours after which pending payments expire (default: 24)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be cleaned up without actually doing it',
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Starting payment cleanup...')
        
        try:
            # Find expired payments
            expiry_time = timezone.now() - timedelta(hours=options['hours'])
            
            expired_payments = Payment.objects.filter(
                status='pending',
                initiated_at__lt=expiry_time
            )
            
            # Also find related enrollments
            expired_enrollments = CourseEnrollment.objects.filter(
                payment_status='pending',
                created_at__lt=expiry_time
            )
            
            if options['dry_run']:
                self.stdout.write(
                    self.style.WARNING('DRY RUN MODE - No actual cleanup will occur')
                )
                
                self.stdout.write(f"Would expire {expired_payments.count()} payments")
                self.stdout.write(f"Would cancel {expired_enrollments.count()} enrollments")
                
                for payment in expired_payments[:10]:  # Show first 10
                    self.stdout.write(
                        f"  Payment: {payment.reference} - {payment.user.email} - {payment.course.title}"
                    )
                
                return
            
            # Actually clean up
            expired_count = expired_payments.count()
            enrollment_count = expired_enrollments.count()
            
            # Mark payments as cancelled
            expired_payments.update(
                status='cancelled',
                failure_reason='Payment expired - not completed within time limit'
            )
            
            # Cancel related enrollments
            expired_enrollments.delete()  # Or update status if you want to keep records
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Cleaned up {expired_count} expired payments and {enrollment_count} enrollments'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during cleanup: {str(e)}')
            )
