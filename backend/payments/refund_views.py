# payments/refund_views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import logging

from .models import Payment, PaymentRefund, InstructorPayout
from .services import PaymentServiceFactory
from courses.models import CourseEnrollment, UserCourseProgress
from utils.auth import EmailService
from .serializers import RefundSerializer

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_refund(request, payment_id):
    """
    Request a refund for a payment - STUDENTS ONLY
    POST /api/payments/{payment_id}/refund/
    """
    # Students (users) can request refunds
    if request.user.role not in ['user']:
        return Response({'detail': 'Only students can request refunds'}, status=403)
    
    try:
        # Get the payment
        payment = Payment.objects.get(
            id=payment_id,
            user=request.user,
            status='completed'
        )
        
        # Check if payment is eligible for refund
        if not payment.is_refundable():
            return Response(
                {'detail': 'This payment is not eligible for refund.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if refund already exists
        existing_refund = PaymentRefund.objects.filter(
            payment=payment,
            status__in=['pending', 'processing', 'completed']
        ).first()
        
        if existing_refund:
            return Response(
                {'detail': 'A refund request already exists for this payment.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get refund details from request
        reason = request.data.get('reason', '').strip()
        refund_amount = request.data.get('amount')
        
        if not reason:
            return Response(
                {'detail': 'Refund reason is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate refund amount
        if refund_amount:
            try:
                refund_amount = Decimal(str(refund_amount))
                if refund_amount <= 0 or refund_amount > payment.amount:
                    return Response(
                        {'detail': 'Invalid refund amount.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {'detail': 'Invalid refund amount format.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Full refund if no amount specified
            refund_amount = payment.amount
        
        # Create refund request
        with transaction.atomic():
            refund = PaymentRefund.objects.create(
                payment=payment,
                user=request.user,
                amount=refund_amount,
                reason=reason,
                status='pending',
                requested_at=timezone.now()
            )
            
            # Process refund automatically or mark for manual review
            auto_process = payment.amount <= Decimal('50000.00')  # Auto-process refunds <= 50k NGN
            
            if auto_process:
                # Process refund immediately
                result = process_refund_with_instructor_deduction(refund)
                if not result['success']:
                    refund.status = 'failed'
                    refund.failure_reason = result['message']
                    refund.save()
                    
                    return Response(
                        {'detail': f'Refund processing failed: {result["message"]}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Mark for manual review by platform managers
                refund.status = 'pending_review'
                refund.save()
                
                # Send notification to platform managers (super_admins)
                EmailService.send_refund_review_notification(refund)
            
            # Send confirmation to user
            EmailService.send_refund_request_confirmation(request.user, refund)
            
            logger.info(f"Refund request created: {request.user.email} -> {payment.reference} (Amount: {refund_amount})")
            
            return Response({
                'message': 'Refund request submitted successfully.',
                'refund': RefundSerializer(refund).data,
                'auto_processed': auto_process and refund.status != 'failed'
            }, status=status.HTTP_201_CREATED)
    
    except Payment.DoesNotExist:
        return Response(
            {'detail': 'Payment not found or not accessible.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Refund request error: {str(e)}")
        return Response(
            {'detail': 'Failed to process refund request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_refunds(request):
    """
    Get user's refund requests - STUDENTS ONLY
    GET /api/payments/my-refunds/
    """
    # Only students can view their refunds
    if request.user.role != 'user':
        return Response({'detail': 'Student access required'}, status=403)
    
    try:
        refunds = PaymentRefund.objects.filter(user=request.user).order_by('-requested_at')
        
        # Pagination
        from django.core.paginator import Paginator
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))
        
        paginator = Paginator(refunds, per_page)
        page_obj = paginator.get_page(page)
        
        serializer = RefundSerializer(page_obj.object_list, many=True)
        
        return Response({
            'refunds': serializer.data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_refunds': paginator.count,
                'per_page': per_page,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"My refunds error: {str(e)}")
        return Response(
            {'detail': 'Failed to fetch refunds.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_refund(request, refund_id):
    """
    Process a refund - PLATFORM MANAGERS ONLY (super_admin)
    POST /api/refunds/{refund_id}/process/
    """
    # Only platform managers (super_admin) can process refunds
    if request.user.role != 'super_admin':
        return Response(
            {'detail': 'Platform manager access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        refund = PaymentRefund.objects.get(id=refund_id)
        
        if refund.status not in ['pending', 'pending_review']:
            return Response(
                {'detail': 'Refund is not in a processable state.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process the refund
        result = process_refund_with_instructor_deduction(refund)
        
        if result['success']:
            return Response({
                'message': 'Refund processed successfully.',
                'refund': RefundSerializer(refund).data
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'detail': f'Refund processing failed: {result["message"]}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except PaymentRefund.DoesNotExist:
        return Response(
            {'detail': 'Refund not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Process refund error: {str(e)}")
        return Response(
            {'detail': 'Failed to process refund.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_refunds(request):
    """
    Get all pending refunds - PLATFORM MANAGERS ONLY (super_admin)
    GET /api/refunds/pending/
    """
    # Only platform managers can view all pending refunds
    if request.user.role != 'super_admin':
        return Response({'detail': 'Platform manager access required'}, status=403)
    
    try:
        from django.core.paginator import Paginator
        
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        refunds = PaymentRefund.objects.filter(
            status__in=['pending', 'pending_review']
        ).select_related('payment', 'user', 'payment__course').order_by('-requested_at')
        
        paginator = Paginator(refunds, per_page)
        page_obj = paginator.get_page(page)
        
        refunds_data = []
        for refund in page_obj.object_list:
            refunds_data.append({
                'id': str(refund.id),
                'student_name': refund.user.full_name,
                'student_email': refund.user.email,
                'course_title': refund.payment.course.title,
                'amount': float(refund.amount),
                'reason': refund.reason,
                'requested_at': refund.requested_at,
                'status': refund.status,
                'payment_reference': refund.payment.reference
            })
        
        return Response({
            'pending_refunds': refunds_data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_refunds': paginator.count,
                'per_page': per_page,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
        
    except Exception as e:
        logger.error(f"Pending refunds error: {str(e)}")
        return Response({'detail': 'Failed to fetch pending refunds'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_refund_analytics(request):
    """
    Platform admin refund analytics
    GET /api/payments/admin/refund-analytics/
    """
    if request.user.role != 'super_admin':
        return Response({'detail': 'Platform manager access required'}, status=403)
    
    try:
        from django.db.models import Sum, Count, Avg
        from datetime import timedelta
        
        # Time periods
        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        last_90_days = now - timedelta(days=90)
        
        # Overall refund stats
        refund_stats = {
            'total_refunds': PaymentRefund.objects.filter(status='completed').count(),
            'total_refund_amount': PaymentRefund.objects.filter(
                status='completed'
            ).aggregate(total=Sum('amount'))['total'] or 0,
            'last_30_days_refunds': PaymentRefund.objects.filter(
                status='completed',
                completed_at__gte=last_30_days
            ).count(),
            'pending_refunds': PaymentRefund.objects.filter(
                status__in=['pending', 'pending_review']
            ).count(),
            'average_refund_amount': PaymentRefund.objects.filter(
                status='completed'
            ).aggregate(avg=Avg('amount'))['avg'] or 0
        }
        
        # Refund reasons analysis
        refund_reasons = PaymentRefund.objects.filter(
            status='completed'
        ).values('reason').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-count')[:10]
        
        # Top courses with refunds
        course_refunds = PaymentRefund.objects.filter(
            status='completed'
        ).values(
            'payment__course__title',
            'payment__course__created_by__full_name'
        ).annotate(
            refund_count=Count('id'),
            total_refund_amount=Sum('amount')
        ).order_by('-refund_count')[:10]
        
        # Instructor impact summary
        instructor_impact = PaymentRefund.objects.filter(
            status='completed'
        ).values(
            'payment__course__created_by__id',
            'payment__course__created_by__full_name',
            'payment__course__created_by__email'
        ).annotate(
            total_refunds=Count('id'),
            total_refund_amount=Sum('amount'),
            instructor_loss=Sum('amount') * Decimal('0.70')
        ).order_by('-total_refund_amount')[:10]
        
        return Response({
            'refund_statistics': {
                'total_refunds': refund_stats['total_refunds'],
                'total_amount': float(refund_stats['total_refund_amount']),
                'recent_refunds': refund_stats['last_30_days_refunds'],
                'pending_refunds': refund_stats['pending_refunds'],
                'average_amount': float(refund_stats['average_refund_amount'])
            },
            'top_refund_reasons': [
                {
                    'reason': reason['reason'][:100] + '...' if len(reason['reason']) > 100 else reason['reason'],
                    'count': reason['count'],
                    'total_amount': float(reason['total_amount'])
                }
                for reason in refund_reasons
            ],
            'courses_with_most_refunds': [
                {
                    'course_title': course['payment__course__title'],
                    'instructor_name': course['payment__course__created_by__full_name'],
                    'refund_count': course['refund_count'],
                    'total_refund_amount': float(course['total_refund_amount'])
                }
                for course in course_refunds
            ],
            'instructor_refund_impact': [
                {
                    'instructor_name': impact['payment__course__created_by__full_name'],
                    'instructor_email': impact['payment__course__created_by__email'],
                    'total_refunds': impact['total_refunds'],
                    'total_amount': float(impact['total_refund_amount']),
                    'instructor_loss': float(impact['instructor_loss'])
                }
                for impact in instructor_impact
            ]
        })
        
    except Exception as e:
        logger.error(f"Admin refund analytics error: {str(e)}")
        return Response({'detail': 'Failed to fetch refund analytics'}, status=500)


def process_refund_internal(refund):
    """
    Internal function to process refund with payment gateway
    """
    try:
        payment = refund.payment
        
        # Update refund status
        refund.status = 'processing'
        refund.processed_at = timezone.now()
        refund.save()
        
        # Get payment service
        payment_service = PaymentServiceFactory.get_service(payment.gateway.name)
        
        # Initiate refund with gateway
        result = payment_service.initiate_refund(
            payment=payment,
            amount=refund.amount,
            reason=refund.reason
        )
        
        if result['success']:
            # Update refund status
            refund.status = 'completed'
            refund.gateway_response = result.get('data', {})
            refund.gateway_reference = result.get('data', {}).get('id', '')
            refund.completed_at = timezone.now()
            refund.save()
            
            # Handle enrollment cancellation if full refund
            if refund.amount >= payment.amount:
                handle_enrollment_cancellation(payment)
            
            # Send completion notification
            EmailService.send_refund_completed_notification(refund.user, refund)
            
            logger.info(f"Refund completed: {refund.user.email} -> {payment.reference} (Amount: {refund.amount})")
            
            return {'success': True, 'message': 'Refund completed successfully'}
        
        else:
            # Update refund status
            refund.status = 'failed'
            refund.failure_reason = result.get('message', 'Gateway error')
            refund.gateway_response = result.get('error', {})
            refund.save()
            
            return {'success': False, 'message': result.get('message', 'Refund failed')}
    
    except Exception as e:
        # Update refund status
        refund.status = 'failed'
        refund.failure_reason = str(e)
        refund.save()
        
        logger.error(f"Refund processing error: {str(e)}")
        return {'success': False, 'message': f'Processing error: {str(e)}'}


def handle_enrollment_cancellation(payment):
    """
    Handle enrollment cancellation for full refunds
    """
    try:
        # Get enrollment
        enrollment = CourseEnrollment.objects.get(
            payment_id=payment.reference,
            payment_status='completed'
        )
        
        # Check if significant progress has been made
        try:
            progress = UserCourseProgress.objects.get(
                user=enrollment.user,
                course=enrollment.course
            )
            
            # If user has made significant progress, don't cancel enrollment
            # Just mark as refunded but keep access
            if progress.progress_percentage > 20:  # More than 20% progress
                enrollment.payment_status = 'refunded_with_access'
                enrollment.save()
                logger.info(f"Enrollment kept due to progress: {enrollment.user.email} -> {enrollment.course.title}")
                return
        
        except UserCourseProgress.DoesNotExist:
            pass
        
        # Cancel enrollment
        with transaction.atomic():
            enrollment.is_active = False
            enrollment.payment_status = 'refunded'
            enrollment.cancelled_at = timezone.now()
            enrollment.save()
            
            # Archive progress instead of deleting
            if hasattr(enrollment, 'user_progress'):
                progress = enrollment.user_progress.first()
                if progress:
                    progress.is_active = False
                    progress.save()
        
        logger.info(f"Enrollment cancelled: {enrollment.user.email} -> {enrollment.course.title}")
        
    except CourseEnrollment.DoesNotExist:
        logger.warning(f"No enrollment found for payment: {payment.reference}")
    except Exception as e:
        logger.error(f"Enrollment cancellation error: {str(e)}")


def process_refund_with_instructor_deduction(refund):
    """
    Enhanced refund processing that handles instructor payout deductions
    """
    try:
        payment = refund.payment
        instructor = payment.course.created_by
        
        # Update refund status
        refund.status = 'processing'
        refund.processed_at = timezone.now()
        refund.save()
        
        # Calculate instructor's share of refund (70%)
        instructor_refund_amount = refund.amount * Decimal('0.70')
        platform_refund_amount = refund.amount * Decimal('0.30')
        
        with transaction.atomic():
            # Process refund with payment gateway
            payment_service = PaymentServiceFactory.get_service(payment.gateway.name)
            result = payment_service.initiate_refund(
                payment=payment,
                amount=refund.amount,
                reason=refund.reason
            )
            
            if result['success']:
                # Update refund status
                refund.status = 'completed'
                refund.gateway_response = result.get('data', {})
                refund.gateway_reference = result.get('data', {}).get('id', '')
                refund.completed_at = timezone.now()
                refund.save()
                
                # Handle instructor deduction
                handle_instructor_refund_deduction(instructor, instructor_refund_amount, refund)
                
                # Handle enrollment cancellation if full refund
                if refund.amount >= payment.amount:
                    handle_enrollment_cancellation(payment)
                
                # Send notifications
                EmailService.send_refund_completed_notification(refund.user, refund)
                EmailService.send_instructor_refund_notification(instructor, refund, instructor_refund_amount)
                
                logger.info(f"Refund completed with instructor deduction: {refund.user.email} -> {payment.reference} (Amount: {refund.amount})")
                
                return {'success': True, 'message': 'Refund completed successfully'}
            
            else:
                # Update refund status
                refund.status = 'failed'
                refund.failure_reason = result.get('message', 'Gateway error')
                refund.gateway_response = result.get('error', {})
                refund.save()
                
                return {'success': False, 'message': result.get('message', 'Refund failed')}
    
    except Exception as e:
        # Update refund status
        refund.status = 'failed'
        refund.failure_reason = str(e)
        refund.save()
        
        logger.error(f"Refund processing error: {str(e)}")
        return {'success': False, 'message': f'Processing error: {str(e)}'}


def handle_instructor_refund_deduction(instructor, deduction_amount, refund):
    """
    Handle deduction of refunded amount from instructor's future payouts
    """
    try:
        # Strategy 1: Deduct from pending payouts first
        pending_payouts = InstructorPayout.objects.filter(
            instructor=instructor,
            status='pending'
        ).order_by('created_at')
        
        remaining_deduction = deduction_amount
        
        for payout in pending_payouts:
            if remaining_deduction <= 0:
                break
                
            if payout.net_payout >= remaining_deduction:
                # This payout can cover the remaining deduction
                payout.refund_deductions += remaining_deduction
                payout.net_payout -= remaining_deduction
                payout.save()
                
                logger.info(f"Deducted {remaining_deduction} from pending payout {payout.id}")
                remaining_deduction = Decimal('0')
            else:
                # This payout covers partially
                deduction_from_this_payout = payout.net_payout
                payout.refund_deductions += deduction_from_this_payout
                payout.net_payout = Decimal('0')
                payout.save()
                
                remaining_deduction -= deduction_from_this_payout
                logger.info(f"Deducted {deduction_from_this_payout} from pending payout {payout.id}")
        
        # Strategy 2: If there's still remaining deduction, create a negative balance record
        if remaining_deduction > 0:
            create_instructor_refund_debt(instructor, remaining_deduction, refund)
        
        logger.info(f"Instructor refund deduction completed: {instructor.email} -> Total: {deduction_amount}")
        
    except Exception as e:
        logger.error(f"Instructor refund deduction error: {str(e)}")
        # Continue with refund even if deduction fails
        pass


def create_instructor_refund_debt(instructor, debt_amount, refund):
    """
    Create a debt record for instructor when refund exceeds pending payouts
    """
    try:
        # Create a special payout record with negative amount
        debt_payout = InstructorPayout.objects.create(
            instructor=instructor,
            period_start=refund.completed_at.date(),
            period_end=refund.completed_at.date(),
            total_revenue=Decimal('0'),
            instructor_share=Decimal('0'),
            platform_fee=Decimal('0'),
            refund_deductions=debt_amount,
            net_payout=-debt_amount,  # Negative amount indicates debt
            status='debt_created',
            created_at=timezone.now()
        )
        
        logger.info(f"Created instructor debt record: {instructor.email} -> Amount: {debt_amount}")
        
        # Send notification to instructor
        EmailService.send_instructor_debt_notification(instructor, debt_amount, refund)
        
    except Exception as e:
        logger.error(f"Create instructor debt error: {str(e)}")