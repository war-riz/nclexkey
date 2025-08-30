# payments/management/commands/generate_payment_stats.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from payments.models import Payment, PaymentStat
from courses.models import CourseEnrollment
from django.db.models import Sum, Count

class Command(BaseCommand):
    help = 'Generate daily payment statistics'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Generate stats for specific date (YYYY-MM-DD)',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=1,
            help='Number of days to generate stats for (default: 1)',
        )
    
    def handle(self, *args, **options):
        try:
            if options['date']:
                from datetime import datetime
                start_date = datetime.strptime(options['date'], '%Y-%m-%d').date()
                dates_to_process = [start_date]
            else:
                # Process yesterday
                yesterday = timezone.now().date() - timedelta(days=1)
                dates_to_process = [yesterday - timedelta(days=i) for i in range(options['days'])]
            
            for date in dates_to_process:
                self.stdout.write(f"Generating stats for {date}")
                
                # Get payments for this date
                payments = Payment.objects.filter(paid_at__date=date, status='completed')
                
                # Calculate stats
                stats = {
                    'total_transactions': payments.count(),
                    'successful_transactions': payments.count(),
                    'failed_transactions': Payment.objects.filter(
                        failed_at__date=date, status='failed'
                    ).count(),
                    'ngn_revenue': payments.filter(currency='NGN').aggregate(
                        total=Sum('amount')
                    )['total'] or 0,
                    'usd_revenue': payments.filter(currency='USD').aggregate(
                        total=Sum('amount')
                    )['total'] or 0,
                    'total_gateway_fees': payments.aggregate(
                        total=Sum('gateway_fee')
                    )['total'] or 0,
                    'total_platform_fees': payments.aggregate(
                        total=Sum('platform_fee')
                    )['total'] or 0,
                    'course_enrollments': CourseEnrollment.objects.filter(
                        enrolled_at__date=date, payment_status='completed'
                    ).count()
                }
                
                # Calculate net revenue
                stats['net_revenue'] = stats['ngn_revenue'] + stats['usd_revenue'] - stats['total_gateway_fees']
                stats['total_revenue_ngn'] = stats['ngn_revenue'] + (stats['usd_revenue'] * 1600)  # Rough conversion
                
                # Create or update stat record
                stat, created = PaymentStat.objects.update_or_create(
                    date=date,
                    defaults=stats
                )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"{'Created' if created else 'Updated'} stats for {date}: "
                        f"₦{stats['ngn_revenue']:,.2f} revenue, {stats['total_transactions']} transactions"
                    )
                )
        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error generating stats: {str(e)}')
            )