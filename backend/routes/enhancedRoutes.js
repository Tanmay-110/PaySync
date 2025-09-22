const express = require('express');
const {
  getPaymentsByOrderId,
  getAllOrders,
  getAllPayments,
  getAuditLogs,
  getOrderById,
  getPaymentById,
  processRefund,
  getRefunds,
  getDashboardStats,
  getPaymentsByStatus,
  getOrdersByStatus
} = require('../controllers/enhancedPaymentController');

const {
  handleWebhook,
  retryFailedPayments,
  getWebhookStats
} = require('../controllers/enhancedWebhookController');

const router = express.Router();

// Dashboard and statistics routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/webhook/stats', getWebhookStats);

// Order routes
router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderById);
router.get('/orders/status/:status', getOrdersByStatus);

// Payment routes
router.get('/payments', getAllPayments);
// Numeric IDs treated as paymentId
router.get('/payments/:paymentId(\\d+)', getPaymentById);
router.get('/payments/order/:orderId', getPaymentsByOrderId);
// Alphanumeric IDs treated as orderId for compatibility
router.get('/payments/:orderId([A-Za-z]+\\w*)', getPaymentsByOrderId);
router.get('/payments/status/:status', getPaymentsByStatus);

// Refund routes
router.get('/refunds', getRefunds);
router.post('/refunds', processRefund);

// Audit log routes
router.get('/audit-logs', getAuditLogs);

// Webhook routes
router.post('/webhook/payment', handleWebhook);
router.post('/webhook/retry', retryFailedPayments);

module.exports = router;
