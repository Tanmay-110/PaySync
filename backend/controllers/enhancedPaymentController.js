const Payment = require('../models/paymentModel');
const Order = require('../models/orderModel');
const AuditLog = require('../models/auditLogModel');
const Refund = require('../models/refundModel');
const db = require('../models/db');

// Get payments by order ID
const getPaymentsByOrderId = (req, res) => {
  const orderId = req.params.orderId;
  
  Payment.findByOrderId(orderId, (err, results) => {
    if (err) {
      console.error('Error fetching payments:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json(results);
  });
};

// Get all orders with payment information
const getAllOrders = (req, res) => {
  const includePayments = req.query.includePayments === 'true';
  
  if (includePayments) {
    Order.findAllWithPayments((err, results) => {
      if (err) {
        console.error('Error fetching orders with payments:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(200).json(results);
    });
  } else {
    Order.findAll((err, results) => {
      if (err) {
        console.error('Error fetching orders:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(200).json(results);
    });
  }
};

// Get all payments with order information
const getAllPayments = (req, res) => {
  const includeOrders = req.query.includeOrders === 'true';
  
  if (includeOrders) {
    Payment.findAllWithOrders((err, results) => {
      if (err) {
        console.error('Error fetching payments with orders:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(200).json(results);
    });
  } else {
    Payment.findAll((err, results) => {
      if (err) {
        console.error('Error fetching payments:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(200).json(results);
    });
  }
};

// Get audit logs with pagination
const getAuditLogs = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  
  const sql = `
    SELECT 
      pal.*,
      p.gateway_id,
      o.customer_id
    FROM payment_audit_log pal
    LEFT JOIN payments p ON pal.payment_id = p.payment_id
    LEFT JOIN orders o ON p.order_id = o.order_id
    ORDER BY pal.log_time DESC
    LIMIT ? OFFSET ?
  `;
  
  db.query(sql, [limit, offset], (err, results) => {
    if (err) {
      console.error('Error fetching audit logs:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Get total count
    db.query('SELECT COUNT(*) as total FROM payment_audit_log', (err, countResult) => {
      if (err) {
        console.error('Error fetching audit log count:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.status(200).json({
        logs: results,
        pagination: {
          page: page,
          limit: limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      });
    });
  });
};

// Get order by ID with full details
const getOrderById = (req, res) => {
  const orderId = req.params.orderId;
  
  Order.findByIdWithPayments(orderId, (err, results) => {
    if (err) {
      console.error('Error fetching order:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get refunds for this order
    Refund.findByOrderId(orderId, (err, refunds) => {
      if (err) {
        console.error('Error fetching refunds:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.status(200).json({
        order: results[0],
        payments: results,
        refunds: refunds
      });
    });
  });
};

// Get payment by ID with full details
const getPaymentById = (req, res) => {
  const paymentId = req.params.paymentId;
  
  Payment.findById(paymentId, (err, payment) => {
    if (err) {
      console.error('Error fetching payment:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (payment.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Get order details
    Order.findById(payment[0].order_id, (err, order) => {
      if (err) {
        console.error('Error fetching order:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Get refunds for this payment
      Refund.findByPaymentId(paymentId, (err, refunds) => {
        if (err) {
          console.error('Error fetching refunds:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Get audit logs for this payment
        AuditLog.findByPaymentId(paymentId, (err, auditLogs) => {
          if (err) {
            console.error('Error fetching audit logs:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          res.status(200).json({
            payment: payment[0],
            order: order[0],
            refunds: refunds,
            audit_logs: auditLogs
          });
        });
      });
    });
  });
};

// Process refund
const processRefund = (req, res) => {
  const { paymentId, amount, reason, gatewayRefundId } = req.body;
  
  if (!paymentId || !amount || !reason) {
    return res.status(400).json({ error: 'Missing required fields: paymentId, amount, reason' });
  }
  
  // Use stored procedure for refund processing
  const sql = 'CALL sp_process_refund(?, ?, ?, ?)';
  db.query(sql, [paymentId, amount, reason, gatewayRefundId], (err, results) => {
    if (err) {
      console.error('Error processing refund:', err);
      return res.status(500).json({ error: 'Refund processing failed' });
    }
    
    try {
      const refundIdRow = Array.isArray(results) && Array.isArray(results[0]) ? results[0][0] : null;
      const refundId = refundIdRow && (refundIdRow.refund_id || refundIdRow.LAST_INSERT_ID || refundIdRow.insertId);
      res.status(200).json({ 
        message: 'Refund processed successfully',
        refund_id: refundId
      });
    } catch (parseErr) {
      res.status(200).json({ message: 'Refund processed successfully' });
    }
  });
};

// Get refunds
const getRefunds = (req, res) => {
  const orderId = req.query.orderId;
  const paymentId = req.query.paymentId;
  
  if (orderId) {
    Refund.findByOrderId(orderId, (err, results) => {
      if (err) {
        console.error('Error fetching refunds by order:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(200).json(results);
    });
  } else if (paymentId) {
    Refund.findByPaymentId(paymentId, (err, results) => {
      if (err) {
        console.error('Error fetching refunds by payment:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(200).json(results);
    });
  } else {
    Refund.findAll((err, results) => {
      if (err) {
        console.error('Error fetching all refunds:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(200).json(results);
    });
  }
};

// Get dashboard statistics
const getDashboardStats = (req, res) => {
  const stats = {};
  
  // Get order summary
  Order.getOrderSummary((err, orderStats) => {
    if (err) {
      console.error('Error fetching order stats:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    stats.orders = orderStats[0];
    
    // Get payment summary
    Payment.getPaymentSummary((err, paymentStats) => {
      if (err) {
        console.error('Error fetching payment stats:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      stats.payments = paymentStats[0];
      
      // Get refund summary
      Refund.getRefundSummary((err, refundStats) => {
        if (err) {
          console.error('Error fetching refund stats:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        stats.refunds = refundStats[0];
        
        res.status(200).json({
          stats: stats,
          timestamp: new Date().toISOString()
        });
      });
    });
  });
};

// Get payments by status
const getPaymentsByStatus = (req, res) => {
  const status = req.params.status;
  
  Payment.getPaymentsByStatus(status, (err, results) => {
    if (err) {
      console.error('Error fetching payments by status:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json(results);
  });
};

// Get orders by status
const getOrdersByStatus = (req, res) => {
  const status = req.params.status;
  
  Order.getOrdersByStatus(status, (err, results) => {
    if (err) {
      console.error('Error fetching orders by status:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json(results);
  });
};

module.exports = {
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
};
