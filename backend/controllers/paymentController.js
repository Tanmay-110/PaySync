const Payment = require('../models/paymentModel');
const Order = require('../models/orderModel');
const AuditLog = require('../models/auditLogModel');

const getPaymentsByOrderId = (req, res) => {
  const orderId = req.params.orderId;

  Payment.findByOrderId(orderId, (err, results) => {
    if (err) {
      console.error('Error fetching payments: ', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json(results);
  });
};

const getAllOrders = (req, res) => {
  Order.findAll((err, results) => {
    if (err) {
      console.error('Error fetching orders: ', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json(results);
  });
};

const getAllPayments = (req, res) => {
  Payment.findAll((err, results) => {
    if (err) {
      console.error('Error fetching payments: ', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json(results);
  });
};

const getAuditLogs = (req, res) => {
  AuditLog.findAll((err, results) => {
    if (err) {
      console.error('Error fetching audit logs: ', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json(results);
  });
};

module.exports = {
  getPaymentsByOrderId,
  getAllOrders,
  getAllPayments,
  getAuditLogs
};