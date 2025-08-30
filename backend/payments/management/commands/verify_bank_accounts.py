# payments/management/commands/verify_bank_accounts.py
from django.core.management.base import BaseCommand
from payments.models import InstructorBankAccount
from payments.services import BankVerificationService
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Verify instructor bank accounts'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--unverified-only',
            action='store_true',
            help='Only verify unverified accounts',
        )
        parser.add_argument(
            '--max-attempts',
            type=int,
            default=3,
            help='Maximum verification attempts',
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Starting bank account verification...')
        
        try:
            # Get accounts to verify
            accounts = InstructorBankAccount.objects.all()
            
            if options['unverified_only']:
                accounts = accounts.filter(is_verified=False)
            
            accounts = accounts.filter(
                verification_attempts__lt=options['max_attempts']
            )
            
            verified_count = 0
            failed_count = 0
            
            for account in accounts:
                self.stdout.write(f"Verifying: {account.instructor.full_name} - {account.account_number}")
                
                result = BankVerificationService.verify_bank_account(account)
                
                # Update attempts
                account.verification_attempts += 1
                account.last_verification_attempt = timezone.now()
                
                if result['success']:
                    account.is_verified = True
                    account.verified_at = timezone.now()
                    account.verified_account_name = result['account_name']
                    account.verification_provider = result['provider']
                    account.verification_error = None
                    account.save()
                    
                    verified_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ Verified: {result['account_name']}")
                    )
                else:
                    account.verification_error = result['message']
                    account.save()
                    
                    failed_count += 1
                    self.stdout.write(
                        self.style.ERROR(f"  ✗ Failed: {result['message']}")
                    )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Completed: {verified_count} verified, {failed_count} failed'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error verifying accounts: {str(e)}')
            )
