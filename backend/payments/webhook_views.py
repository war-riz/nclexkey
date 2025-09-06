# payments/webhook_views.py
import json
import logging
import hmac
import hashlib
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from .models import Payment, PaymentGateway
from django.utils import timezone

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def paystack_webhook(request):
    """Handle Paystack webhooks for student registration payments"""
    try:
        # Verify webhook signature
        signature = request.headers.get('X-Paystack-Signature')
        if not signature:
            logger.error("Missing Paystack signature in webhook")
            return JsonResponse({'error': 'Missing signature'}, status=400)
        
        # Verify signature
        expected_signature = hmac.new(
            settings.PAYSTACK_SECRET_KEY.encode('utf-8'),
            request.body,
            hashlib.sha512
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            logger.error("Invalid Paystack signature in webhook")
            return JsonResponse({'error': 'Invalid signature'}, status=400)
        
        # Parse webhook data
        data = json.loads(request.body)
        event = data.get('event')
        
        logger.info(f"Paystack webhook received: {event}")
        
        if event == 'charge.success':
            # Handle successful payment
            payment_data = data.get('data', {})
            reference = payment_data.get('reference')
            
            try:
                # Find payment by Paystack reference
                payment = Payment.objects.get(gateway_reference=reference)
                
                # Update payment status
                payment.status = 'completed'
                payment.gateway_reference = payment_data.get('id', '')
                payment.metadata = {
                    **payment.metadata,
                    'paystack_webhook_data': data,
                    'webhook_processed_at': timezone.now().isoformat()
                }
                payment.completed_at = timezone.now()
                payment.save()
                
                logger.info(f"Student registration payment {payment.reference} marked as completed via webhook")
                
                return JsonResponse({'status': 'success'})
                
            except Payment.DoesNotExist:
                logger.error(f"Payment with Paystack reference {reference} not found")
                return JsonResponse({'error': 'Payment not found'}, status=404)
        
        elif event == 'charge.failed':
            # Handle failed payment
            payment_data = data.get('data', {})
            reference = payment_data.get('reference')
            
            try:
                payment = Payment.objects.get(gateway_reference=reference)
                payment.status = 'failed'
                payment.metadata = {
                    **payment.metadata,
                    'paystack_webhook_data': data,
                    'webhook_processed_at': timezone.now().isoformat(),
                    'failure_reason': payment_data.get('failure_reason', 'Unknown')
                }
                payment.save()
                
                logger.info(f"Student registration payment {payment.reference} marked as failed via webhook")
                
                return JsonResponse({'status': 'success'})
                
            except Payment.DoesNotExist:
                logger.error(f"Payment with Paystack reference {reference} not found for failed charge")
                return JsonResponse({'error': 'Payment not found'}, status=404)
        
        else:
            logger.info(f"Ignoring webhook event: {event}")
            return JsonResponse({'status': 'ignored'})
            
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def flutterwave_webhook(request):
    """Handle Flutterwave webhooks"""
    try:
        # Verify webhook signature
        signature = request.headers.get('Verif-Hash')
        if not signature:
            return JsonResponse({'error': 'Missing signature'}, status=400)
        
        # Verify signature
        expected_signature = hmac.new(
            settings.FLUTTERWAVE_SECRET_KEY.encode('utf-8'),
            request.body,
            hashlib.sha512
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            return JsonResponse({'error': 'Invalid signature'}, status=400)
        
        # Parse webhook data
        data = json.loads(request.body)
        status = data.get('status')
        tx_ref = data.get('tx_ref')
        
        if status == 'successful':
            # Handle successful payment
            try:
                payment = Payment.objects.get(reference=tx_ref)
                payment.status = 'completed'
                payment.gateway_reference = data.get('id', '')
                payment.metadata = data
                payment.save()
                
                logger.info(f"Payment {tx_ref} marked as completed")
                return JsonResponse({'status': 'success'})
                
            except Payment.DoesNotExist:
                logger.error(f"Payment with reference {tx_ref} not found")
                return JsonResponse({'error': 'Payment not found'}, status=404)
        
        return JsonResponse({'status': 'ignored'})
        
    except Exception as e:
        logger.error(f"Flutterwave webhook error: {str(e)}")
        return JsonResponse({'error': 'Internal error'}, status=500)