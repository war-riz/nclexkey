# payments/management/commands/process_monthly_payouts.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import logging
from payments.services import PayoutService
from payments.models import InstructorPayout

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Process monthly instructor payouts'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be processed without actually processing',
        )
        parser.add_argument(
            '--auto-process',
            action='store_true',
            help='Automatically process small payouts (under 10k NGN)',
        )
        parser.add_argument(
            '--month',
            type=str,
            help='Process specific month (YYYY-MM format, e.g., 2024-01)',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting monthly payout processing...')
        )
        
        try:
            if options['month']:
                # Process specific month
                from datetime import datetime
                year, month = map(int, options['month'].split('-'))
                period_start = datetime(year, month, 1).date()
                
                # Get last day of month
                if month == 12:
                    period_end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
                else:
                    period_end = datetime(year, month + 1, 1).date() - timedelta(days=1)
                
                self.stdout.write(f"Processing payouts for {period_start} to {period_end}")
            else:
                # Process last month
                today = timezone.now().date()
                last_month = today.replace(day=1) - timedelta(days=1)
                period_start = last_month.replace(day=1)
                period_end = last_month
                
                self.stdout.write(f"Processing payouts for last month: {period_start} to {period_end}")
            
            if options['dry_run']:
                self.stdout.write(
                    self.style.WARNING('DRY RUN MODE - No actual processing will occur')
                )
                
                # Show what would be processed
                from payments.services import PayoutService
                from users.models import User
                from django.db.models import Sum
                from payments.models import Payment
                
                instructors_with_earnings = User.objects.filter(
                    role='admin',
                    is_active=True,
                    created_courses__payments__status='completed',
                    created_courses__payments__paid_at__date__gte=period_start,
                    created_courses__payments__paid_at__date__lte=period_end
                ).distinct()
                
                total_payouts = 0
                total_amount = 0
                auto_processable = 0
                
                for instructor in instructors_with_earnings:
                    earnings = PayoutService.calculate_instructor_earnings(
                        instructor, period_start, period_end
                    )
                    
                    if earnings['net_instructor_share'] > 0:
                        total_payouts += 1
                        total_amount += float(earnings['net_instructor_share'])
                        
                        if earnings['net_instructor_share'] <= 10000:
                            auto_processable += 1
                        
                        self.stdout.write(
                            f"  {instructor.full_name}: ₦{earnings['net_instructor_share']:,.2f}"
                        )
                
                self.stdout.write(f"\nSummary:")
                self.stdout.write(f"  Total instructors: {total_payouts}")
                self.stdout.write(f"  Total amount: ₦{total_amount:,.2f}")
                self.stdout.write(f"  Auto-processable: {auto_processable}")
                
                return
            
            # Actually create payouts
            created_payouts = PayoutService.create_monthly_payouts()
            
            auto_processed = 0
            if options['auto_process']:
                self.stdout.write("Auto-processing eligible payouts...")
                
                for payout in created_payouts:
                    if payout.net_payout <= 10000:  # 10k NGN limit
                        result = PayoutService.process_payout(payout.id, auto_process=True)
                        if result['success']:
                            auto_processed += 1
                            self.stdout.write(
                                f"  ✓ Auto-processed: {payout.instructor.full_name} - ₦{payout.net_payout:,.2f}"
                            )
                        else:
                            self.stdout.write(
                                self.style.ERROR(
                                    f"  ✗ Failed: {payout.instructor.full_name} - {result['message']}"
                                )
                            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nCompleted: Created {len(created_payouts)} payouts, '
                    f'auto-processed {auto_processed}'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error processing payouts: {str(e)}')
            )
            logger.error(f"Monthly payout processing error: {str(e)}")