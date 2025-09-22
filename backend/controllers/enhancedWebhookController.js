const crypto = require('crypto');
const Payment = require('../models/paymentModel');
const Order = require('../models/orderModel');
const AuditLog = require('../models/auditLogModel');
const { reconcilePayment } = require('../services/paymentService');

// Webhook signature verification
const verifyWebhookSignature = (payload, signature, secret) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

// Retry mechanism for failed webhook processing
const retryWebhookProcessing = async (paymentId, maxRetries = 3) => {
  const Payment = require('../models/paymentModel');
  
  return new Promise((resolve, reject) => {
    Payment.findById(paymentId, (err, payment) => {
      if (err) return reject(err);
      if (!payment) return reject(new Error('Payment not found'));
      
      if (payment.retry_count >= maxRetries) {
        return reject(new Error('Max retries exceeded'));
      }
      
      // Update retry count
      Payment.updateRetryInfo(paymentId, payment.retry_count + 1, (err) => {
        if (err) return reject(err);
        
        // Retry reconciliation
        reconcilePayment(paymentId, (err, result) => {
          if (err) {
            console.error(`Retry ${payment.retry_count + 1} failed for payment ${paymentId}:`, err);
            return reject(err);
          }
          resolve(result);
        });
      });
    });
  });
};

const handleWebhook = (req, res) => {
  const webhookData = req.body;
  const signature = req.headers['x-payment-signature'] || req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.WEBHOOK_SECRET || 'your_webhook_secret_key';
  
  // Verify webhook signature
  if (process.env.NODE_ENV === 'production' && signature) {
    const payload = JSON.stringify(webhookData);
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Unauthorized: Invalid signature' });
    }
  }
  
  // Validate required fields
  const requiredFields = ['order_id', 'amount', 'status', 'gateway_id'];
  for (const field of requiredFields) {
    if (!webhookData[field]) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }
  
  // Check for duplicate webhook using gateway_id
  Payment.findByGatewayId(webhookData.gateway_id, (err, results) => {
    if (err) {
      console.error('Error checking for duplicate payment:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (results.length > 0) {
      // Duplicate found - idempotent response
      console.log(`Duplicate webhook received for gateway_id: ${webhookData.gateway_id}`);
      return res.status(200).json({ 
        message: 'Webhook already processed',
        payment_id: results[0].payment_id 
      });
    }
    
    // Verify order exists
    Order.findById(webhookData.order_id, (err, orderResults) => {
      if (err) {
        console.error('Error checking order:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (orderResults.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Create new payment record
      const paymentData = {
        order_id: webhookData.order_id,
        amount: parseFloat(webhookData.amount),
        currency: webhookData.currency || 'USD',
        status: webhookData.status,
        payment_date: new Date(),
        gateway_id: webhookData.gateway_id,
        gateway_name: webhookData.gateway_name || 'razorpay',
        gateway_response: JSON.stringify(webhookData.gateway_response || {}),
        retry_count: 0
      };
      
      Payment.create(paymentData, (err, result) => {
        if (err) {
          console.error('Error creating payment:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        const paymentId = result.insertId;
        
        // Reconcile the payment
        reconcilePayment(paymentId, (err, reconcileResult) => {
          if (err) {
            console.error('Error reconciling payment:', err);
            
            // If reconciliation fails, we'll retry later
            // For now, return success but log the error
            return res.status(200).json({ 
              message: 'Webhook received, reconciliation will be retried',
              payment_id: paymentId,
              warning: 'Reconciliation failed, will retry'
            });
          }
          
          res.status(200).json({ 
            message: 'Webhook processed successfully', 
            payment_id: paymentId,
            reconciliation: reconcileResult
          });
        });
      });
    });
  });
};

// Endpoint to retry failed payments
const retryFailedPayments = (req, res) => {
  const maxRetries = parseInt(req.query.maxRetries) || 3;
  
  Payment.getFailedPaymentsForRetry(maxRetries, (err, failedPayments) => {
    if (err) {
      console.error('Error fetching failed payments:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (failedPayments.length === 0) {
      return res.status(200).json({ message: 'No failed payments to retry' });
    }
    
    const retryPromises = failedPayments.map(payment => 
      retryWebhookProcessing(payment.payment_id, maxRetries)
        .then(result => ({ payment_id: payment.payment_id, status: 'success', result }))
        .catch(error => ({ payment_id: payment.payment_id, status: 'failed', error: error.message }))
    );
    
    Promise.all(retryPromises)
      .then(results => {
        const successful = results.filter(r => r.status === 'success').length;
        const failed = results.filter(r => r.status === 'failed').length;
        
        res.status(200).json({
          message: `Retry completed: ${successful} successful, ${failed} failed`,
          results: results
        });
      })
      .catch(error => {
        console.error('Error during retry process:', error);
        res.status(500).json({ error: 'Retry process failed' });
      });
  });
};

// Endpoint to get webhook processing statistics
const getWebhookStats = (req, res) => {
  Payment.getPaymentSummary((err, paymentStats) => {
    if (err) {
      console.error('Error fetching payment stats:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Get recent audit logs
    AuditLog.findAll((err, auditLogs) => {
      if (err) {
        console.error('Error fetching audit logs:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      const recentLogs = auditLogs.slice(0, 10);
      
      res.status(200).json({
        payment_stats: paymentStats[0],
        recent_activity: recentLogs,
        timestamp: new Date().toISOString()
      });
    });
  });
};

module.exports = {
  handleWebhook,
  retryFailedPayments,
  getWebhookStats,
  verifyWebhookSignature
};
