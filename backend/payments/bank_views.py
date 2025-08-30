# payments/bank_views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from .models import PaymentRefund, InstructorBankAccount, InstructorPayout
from .services import PayoutService, BankVerificationService
from django.db.models import Sum
from decimal import Decimal
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_banks(request):
    """Get list of supported banks"""
    try:
        result = BankVerificationService.get_bank_list()
        
        if result['success']:
            return Response({
                'banks': result['banks']
            })
        else:
            return Response({
                'detail': result['message']
            }, status=500)
            
    except Exception as e:
        logger.error(f"Get banks error: {str(e)}")
        return Response({'detail': 'Failed to fetch banks'}, status=500)
    

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def instructor_bank_account(request):
    """Get or create instructor bank account"""
    if request.user.role != 'admin':
        return Response({'detail': 'Access denied'}, status=403)
    
    if request.method == 'GET':
        try:
            bank_account = request.user.bank_account
            return Response({
                'bank_name': bank_account.bank_name,
                'account_number': bank_account.account_number,
                'account_name': bank_account.account_name,
                'bank_code': bank_account.bank_code,
                'is_verified': bank_account.is_verified,
                'verified_at': bank_account.verified_at,
                'auto_payout_enabled': bank_account.auto_payout_enabled,
                'verification_attempts': bank_account.verification_attempts,
                'last_verification_attempt': bank_account.last_verification_attempt,
                'verification_error': bank_account.verification_error
            })
        except InstructorBankAccount.DoesNotExist:
            return Response({'message': 'No bank account configured'}, status=404)
    
    elif request.method == 'POST':
        # Validate required fields
        required_fields = ['bank_name', 'account_number', 'account_name', 'bank_code']
        for field in required_fields:
            if not request.data.get(field):
                return Response({
                    'detail': f'{field.replace("_", " ").title()} is required'
                }, status=400)
        
        # Validate account number length (Nigerian banks typically use 10 digits)
        account_number = request.data['account_number'].strip()
        if not account_number.isdigit() or len(account_number) != 10:
            return Response({
                'detail': 'Account number must be exactly 10 digits'
            }, status=400)
        
        try:
            with transaction.atomic():
                # Get or create bank account
                bank_account, created = InstructorBankAccount.objects.get_or_create(
                    instructor=request.user,
                    defaults={
                        'bank_name': request.data['bank_name'].strip(),
                        'account_number': account_number,
                        'account_name': request.data['account_name'].strip(),
                        'bank_code': request.data['bank_code'].strip(),
                        'auto_payout_enabled': request.data.get('auto_payout_enabled', False),
                        'is_verified': False,
                        'verification_attempts': 0
                    }
                )
                
                if not created:
                    # Update existing account
                    bank_account.bank_name = request.data['bank_name'].strip()
                    bank_account.account_number = account_number
                    bank_account.account_name = request.data['account_name'].strip()
                    bank_account.bank_code = request.data['bank_code'].strip()
                    bank_account.auto_payout_enabled = request.data.get('auto_payout_enabled', False)
                    bank_account.is_verified = False  # Reset verification on update
                    bank_account.verified_at = None
                    bank_account.verification_attempts = 0
                    bank_account.verification_error = None
                
                # Verify the bank account
                verification_result = BankVerificationService.verify_bank_account(bank_account)
                
                # Update verification attempts
                bank_account.verification_attempts += 1
                bank_account.last_verification_attempt = timezone.now()
                
                if verification_result['success']:
                    bank_account.is_verified = True
                    bank_account.verified_at = timezone.now()
                    bank_account.verified_account_name = verification_result['account_name']
                    bank_account.verification_provider = verification_result['provider']
                    bank_account.verification_error = None
                    bank_account.save()
                    
                    logger.info(f"Bank account {'created' if created else 'updated'} and verified: {request.user.email}")
                    
                    return Response({
                        'message': f'Bank account {"configured" if created else "updated"} and verified successfully',
                        'is_verified': True,
                        'account_name': verification_result['account_name'],
                        'auto_payout_enabled': bank_account.auto_payout_enabled,
                        'created': created
                    })
                else:
                    bank_account.verification_error = verification_result['message']
                    bank_account.save()
                    
                    logger.warning(f"Bank account saved but verification failed: {request.user.email} - {verification_result['message']}")
                    
                    return Response({
                        'message': f'Bank account {"saved" if created else "updated"} but verification failed',
                        'error': verification_result['message'],
                        'is_verified': False,
                        'can_retry': bank_account.verification_attempts < 3,
                        'attempts_remaining': 3 - bank_account.verification_attempts,
                        'created': created
                    }, status=400)
                    
        except Exception as e:
            logger.error(f"Bank account configuration error: {str(e)}")
            return Response({
                'detail': 'Failed to configure bank account. Please try again.'
            }, status=500)
        

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_bank_account(request):
    """Re-verify existing bank account"""
    if request.user.role != 'admin':
        return Response({'detail': 'Access denied'}, status=403)
    
    try:
        bank_account = request.user.bank_account
        
        # Check verification attempts limit
        if bank_account.verification_attempts >= 3:
            return Response({
                'detail': 'Maximum verification attempts reached. Please contact support.'
            }, status=400)
        
        # Verify the bank account
        verification_result = BankVerificationService.verify_bank_account(bank_account)
        
        # Update verification attempts
        bank_account.verification_attempts += 1
        bank_account.last_verification_attempt = timezone.now()
        
        if verification_result['success']:
            bank_account.is_verified = True
            bank_account.verified_at = timezone.now()
            bank_account.verified_account_name = verification_result['account_name']
            bank_account.verification_provider = verification_result['provider']
            bank_account.verification_error = None
            bank_account.save()
            
            return Response({
                'message': 'Bank account verified successfully',
                'is_verified': True,
                'account_name': verification_result['account_name']
            })
        else:
            bank_account.verification_error = verification_result['message']
            bank_account.save()
            
            return Response({
                'message': 'Bank account verification failed',
                'error': verification_result['message'],
                'attempts_remaining': 3 - bank_account.verification_attempts
            }, status=400)
            
    except InstructorBankAccount.DoesNotExist:
        return Response({'detail': 'No bank account found'}, status=404)
    except Exception as e:
        logger.error(f"Bank account verification error: {str(e)}")
        return Response({'detail': 'Verification failed'}, status=500)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_auto_payout(request):
    """Enable/disable auto payout"""
    if request.user.role != 'admin':
        return Response({'detail': 'Access denied'}, status=403)
    
    try:
        bank_account = request.user.bank_account
        
        if not bank_account.is_verified:
            return Response({
                'detail': 'Bank account must be verified before enabling auto payout'
            }, status=400)
        
        enable = request.data.get('enable', False)
        bank_account.auto_payout_enabled = enable
        bank_account.save()
        
        return Response({
            'message': f'Auto payout {"enabled" if enable else "disabled"} successfully',
            'auto_payout_enabled': bank_account.auto_payout_enabled
        })
        
    except InstructorBankAccount.DoesNotExist:
        return Response({'detail': 'No bank account found'}, status=404)
    except Exception as e:
        logger.error(f"Toggle auto payout error: {str(e)}")
        return Response({'detail': 'Failed to update auto payout setting'}, status=500)
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_bank_account(request):
    """Delete instructor bank account"""
    if request.user.role != 'admin':
        return Response({'detail': 'Access denied'}, status=403)
    
    try:
        bank_account = request.user.bank_account
        
        # Check if there are pending payouts
        pending_payouts = InstructorPayout.objects.filter(
            instructor=request.user,
            status='pending'
        ).count()
        
        if pending_payouts > 0:
            return Response({
                'detail': f'Cannot delete bank account. You have {pending_payouts} pending payouts.',
                'pending_payouts': pending_payouts,
                'suggestion': 'Please wait for pending payouts to be processed before deleting your bank account.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        bank_account.delete()
        
        logger.info(f"Bank account deleted for instructor: {request.user.email}")
        
        return Response({
            'message': 'Bank account deleted successfully'
        }, status=status.HTTP_200_OK)
        
    except InstructorBankAccount.DoesNotExist:
        return Response({'detail': 'No bank account found'}, status=404)
    except Exception as e:
        logger.error(f"Delete bank account error: {str(e)}")
        return Response({'detail': 'Failed to delete bank account'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bank_account_summary(request):
    """Get bank account summary with earnings info"""
    if request.user.role != 'admin':
        return Response({'detail': 'Access denied'}, status=403)
    
    try:
        bank_account = None
        try:
            bank_account = request.user.bank_account
        except InstructorBankAccount.DoesNotExist:
            pass
        
        # Calculate earnings
        from courses.models import CourseEnrollment
        total_revenue = CourseEnrollment.objects.filter(
            course__created_by=request.user,
            payment_status='completed'
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        
        instructor_earnings = float(total_revenue) * 0.7  # 70% to instructor
        
        # Pending payouts
        pending_payouts = InstructorPayout.objects.filter(
            instructor=request.user,
            status='pending'
        ).aggregate(total=Sum('net_payout'))['total'] or 0
        
        # Processed payouts
        processed_payouts = InstructorPayout.objects.filter(
            instructor=request.user,
            status='completed'
        ).aggregate(total=Sum('net_payout'))['total'] or 0
        
        response_data = {
            'earnings_summary': {
                'total_revenue': float(total_revenue),
                'instructor_share': instructor_earnings,
                'platform_fee': float(total_revenue) * 0.3,
                'pending_payouts': float(pending_payouts),
                'processed_payouts': float(processed_payouts),
                'available_balance': instructor_earnings - float(processed_payouts) - float(pending_payouts)
            },
            'bank_account': None
        }
        
        if bank_account:
            response_data['bank_account'] = {
                'bank_name': bank_account.bank_name,
                'account_number': bank_account.account_number,
                'account_name': bank_account.account_name,
                'bank_code': bank_account.bank_code,
                'is_verified': bank_account.is_verified,
                'verified_at': bank_account.verified_at,
                'auto_payout_enabled': bank_account.auto_payout_enabled,
                'verification_attempts': bank_account.verification_attempts,
                'last_verification_attempt': bank_account.last_verification_attempt,
                'verification_error': bank_account.verification_error
            }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Bank account summary error: {str(e)}")
        return Response({'detail': 'Failed to fetch bank account summary'}, status=500)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payout_history(request):
    """Get instructor payout history"""
    if request.user.role != 'admin':
        return Response({'detail': 'Access denied'}, status=403)
    
    try:
        from django.core.paginator import Paginator
        
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        payouts = InstructorPayout.objects.filter(
            instructor=request.user
        ).order_by('-created_at')
        
        paginator = Paginator(payouts, per_page)
        page_obj = paginator.get_page(page)
        
        payout_data = []
        for payout in page_obj.object_list:
            payout_data.append({
                'id': str(payout.id),
                'period_start': payout.period_start,
                'period_end': payout.period_end,
                'total_revenue': float(payout.total_revenue),
                'instructor_share': float(payout.instructor_share),
                'platform_fee': float(payout.platform_fee),
                'net_payout': float(payout.net_payout),
                'status': payout.status,
                'processed_at': payout.processed_at,
                'gateway_reference': payout.gateway_reference,
                'is_auto_processed': payout.is_auto_processed
            })
        
        return Response({
            'payouts': payout_data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_payouts': paginator.count,
                'per_page': per_page,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
        
    except Exception as e:
        logger.error(f"Payout history error: {str(e)}")
        return Response({'detail': 'Failed to fetch payout history'}, status=500)
    
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_refund_impact(request):
    """
    Get instructor's refund impact summary
    GET /api/payments/instructor/refund-impact/
    """
    if request.user.role != 'admin':
        return Response({'detail': 'Access denied'}, status=403)
    
    try:
        from django.db.models import Sum, Q
        
        # Get refunds that affected this instructor
        instructor_refunds = PaymentRefund.objects.filter(
            payment__course__created_by=request.user,
            status='completed'
        ).select_related('payment', 'payment__course')
        
        total_refunds = instructor_refunds.aggregate(
            total_amount=Sum('amount')
        )['total_amount'] or Decimal('0')
        
        instructor_loss = total_refunds * Decimal('0.70')  # 70% instructor share
        
        # Get pending deductions
        pending_deductions = InstructorPayout.objects.filter(
            instructor=request.user,
            refund_deductions__gt=0,
            status='pending'
        ).aggregate(
            total_deductions=Sum('refund_deductions')
        )['total_deductions'] or Decimal('0')
        
        # Get debt balance
        debt_balance = InstructorPayout.objects.filter(
            instructor=request.user,
            net_payout__lt=0,
            status='debt_created'
        ).aggregate(
            total_debt=Sum('net_payout')
        )['total_debt'] or Decimal('0')
        debt_balance = abs(debt_balance)
        
        # Recent refunds affecting this instructor
        recent_refunds = []
        for refund in instructor_refunds.order_by('-completed_at')[:10]:
            instructor_impact = refund.amount * Decimal('0.70')
            recent_refunds.append({
                'refund_id': str(refund.id),
                'student_name': refund.user.full_name,
                'course_title': refund.payment.course.title,
                'total_refund': float(refund.amount),
                'instructor_impact': float(instructor_impact),
                'refund_date': refund.completed_at,
                'reason': refund.reason
            })
        
        return Response({
            'summary': {
                'total_refunds_count': instructor_refunds.count(),
                'total_refund_amount': float(total_refunds),
                'instructor_total_loss': float(instructor_loss),
                'pending_deductions': float(pending_deductions),
                'outstanding_debt': float(debt_balance),
                'impact_on_earnings': f"{(instructor_loss / (instructor_loss + Decimal('1000'))) * 100:.1f}%"
            },
            'recent_refunds': recent_refunds,
            'mitigation_strategies': [
                'Improve course quality to reduce refund requests',
                'Add course preview content to set proper expectations',
                'Provide excellent student support',
                'Consider offering course credits instead of refunds'
            ]
        })
        
    except Exception as e:
        logger.error(f"Instructor refund impact error: {str(e)}")
        return Response({'detail': 'Failed to fetch refund impact'}, status=500)