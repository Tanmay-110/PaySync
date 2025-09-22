const express = require('express');
const {
  getPaymentsByOrderId,
  getAllOrders,
  getAllPayments,
  getAuditLogs
} = require('../controllers/paymentController');

const router = express.Router();

router.get('/:orderId', getPaymentsByOrderId);
router.get('/orders/all', getAllOrders);
router.get('/payments/all', getAllPayments);
router.get('/audit-logs/all', getAuditLogs);

module.exports = router;