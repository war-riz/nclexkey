# payments/payout_views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Sum
from datetime import datetime, timedelta
from django.utils import timezone
from .models import InstructorPayout
from .services import PayoutService
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_earnings(request):
    """Get instructor's earnings summary"""
    if request.user.role != 'admin':
        return Response({'detail': 'Access denied'}, status=403)
    
    try:
        # Get date range
        days = int(request.GET.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Calculate earnings
        earnings = PayoutService.calculate_instructor_earnings(
            request.user, start_date, end_date
        )
        
        # Get payout history
        payouts = InstructorPayout.objects.filter(
            instructor=request.user
        ).order_by('-created_at')[:5]
        
        payout_data = []
        for payout in payouts:
            payout_data.append({
                'id': str(payout.id),
                'period': f"{payout.period_start} to {payout.period_end}",
                'net_payout': float(payout.net_payout),
                'status': payout.status,
                'processed_at': payout.processed_at
            })
        
        return Response({
            'current_period_earnings': {
                'total_revenue': float(earnings['total_revenue']),
                'your_share': float(earnings['net_instructor_share']),
                'platform_fee': float(earnings['platform_fee']),
                'gateway_fees': float(earnings['gateway_fees']),
                'payment_count': earnings['payment_count']
            },
            'recent_payouts': payout_data,
            'payout_schedule': 'Monthly payouts on the 5th of each month',
            'minimum_payout': '1,000 NGN'
        })
        
    except Exception as e:
        logger.error(f"Instructor earnings error: {str(e)}")
        return Response({'detail': 'Failed to fetch earnings'}, status=500)
    

# Super Admin Views for Processing Payouts
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_payouts(request):
    """Super Admin: Get all pending payouts"""
    if request.user.role != 'super_admin':
        return Response({'detail': 'Super admin access required'}, status=403)
    
    try:
        from django.core.paginator import Paginator
        
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        payouts = InstructorPayout.objects.filter(
            status='pending'
        ).select_related('instructor', 'instructor__bank_account').order_by('-created_at')
        
        paginator = Paginator(payouts, per_page)
        page_obj = paginator.get_page(page)
        
        payout_data = []
        for payout in page_obj.object_list:
            bank_account = getattr(payout.instructor, 'bank_account', None)
            
            payout_data.append({
                'id': str(payout.id),
                'instructor_name': payout.instructor.full_name,
                'instructor_email': payout.instructor.email,
                'period_start': payout.period_start,
                'period_end': payout.period_end,
                'net_payout': float(payout.net_payout),
                'created_at': payout.created_at,
                'is_eligible': payout.is_eligible_for_payout(),
                'bank_verified': bank_account.is_verified if bank_account else False,
                'auto_payout_enabled': bank_account.auto_payout_enabled if bank_account else False
            })
        
        total_pending_amount = InstructorPayout.objects.filter(
            status='pending'
        ).aggregate(total=Sum('net_payout'))['total'] or 0
        
        return Response({
            'pending_payouts': payout_data,
            'total_pending_amount': float(total_pending_amount),
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
        logger.error(f"Pending payouts error: {str(e)}")
        return Response({'detail': 'Failed to fetch pending payouts'}, status=500)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payout_request(request, payout_id):
    """Super Admin: Process individual payout"""
    if request.user.role != 'super_admin':
        return Response({'detail': 'Super admin access required'}, status=403)
    
    try:
        result = PayoutService.process_payout(payout_id)
        
        if result['success']:
            return Response({
                'message': result['message'],
                'success': True
            })
        else:
            return Response({
                'message': result['message'],
                'success': False
            }, status=400)
            
    except Exception as e:
        logger.error(f"Process payout error: {str(e)}")
        return Response({'detail': 'Failed to process payout'}, status=500)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_process_payouts(request):
    """Super Admin: Process multiple payouts at once"""
    if request.user.role != 'super_admin':
        return Response({'detail': 'Super admin access required'}, status=403)
    
    try:
        payout_ids = request.data.get('payout_ids', [])
        
        if not payout_ids:
            return Response({'detail': 'No payout IDs provided'}, status=400)
        
        results = []
        successful_count = 0
        failed_count = 0
        
        for payout_id in payout_ids:
            result = PayoutService.process_payout(payout_id)
            results.append({
                'payout_id': payout_id,
                'success': result['success'],
                'message': result['message']
            })
            
            if result['success']:
                successful_count += 1
            else:
                failed_count += 1
        
        return Response({
            'message': f'Processed {len(payout_ids)} payouts: {successful_count} successful, {failed_count} failed',
            'results': results,
            'summary': {
                'total_processed': len(payout_ids),
                'successful': successful_count,
                'failed': failed_count
            }
        })
        
    except Exception as e:
        logger.error(f"Bulk process payouts error: {str(e)}")
        return Response({'detail': 'Failed to process bulk payouts'}, status=500)