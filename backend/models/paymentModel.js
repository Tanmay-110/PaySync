const db = require('./db');

const Payment = {
  create: (paymentData, callback) => {
    // Filter to columns that exist in the current payments table schema
    const allowed = ['order_id', 'amount', 'status', 'payment_date', 'gateway_id'];
    const filtered = {};
    for (const key of allowed) {
      if (paymentData[key] !== undefined) filtered[key] = paymentData[key];
    }
    const sql = 'INSERT INTO payments SET ?';
    db.query(sql, filtered, callback);
  },
  
  findById: (paymentId, callback) => {
    const sql = 'SELECT * FROM payments WHERE payment_id = ?';
    db.query(sql, [paymentId], callback);
  },
  
  findByOrderId: (orderId, callback) => {
    const sql = 'SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC';
    db.query(sql, [orderId], callback);
  },
  
  findByGatewayId: (gatewayId, callback) => {
    const sql = 'SELECT * FROM payments WHERE gateway_id = ?';
    db.query(sql, [gatewayId], callback);
  },
  
  findAll: (callback) => {
    const sql = 'SELECT * FROM payments ORDER BY payment_date DESC';
    db.query(sql, callback);
  },
  
  findAllWithOrders: (callback) => {
    const sql = `
      SELECT 
        p.*,
        o.customer_id,
        o.total_amount as order_total_amount,
        o.status as order_status
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.order_id
      ORDER BY p.payment_date DESC
    `;
    db.query(sql, callback);
  },
  
  updateStatus: (paymentId, status, callback) => {
    const sql = 'UPDATE payments SET status = ? WHERE payment_id = ?';
    db.query(sql, [status, paymentId], callback);
  },
  
  updateRetryInfo: (paymentId, retryCount, callback) => {
    const sql = 'UPDATE payments SET retry_count = ?, last_retry_at = NOW() WHERE payment_id = ?';
    db.query(sql, [retryCount, paymentId], callback);
  },
  
  getPaymentSummary: (callback) => {
    const sql = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_payments,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial_payments,
        SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_successful_amount,
        SUM(amount) as total_amount
      FROM payments
    `;
    db.query(sql, callback);
  },
  
  getPaymentsByStatus: (status, callback) => {
    const sql = 'SELECT * FROM payments WHERE status = ? ORDER BY payment_date DESC';
    db.query(sql, [status], callback);
  },
  
  getFailedPaymentsForRetry: (maxRetries, callback) => {
    const sql = `
      SELECT * FROM payments 
      WHERE status = 'failed' 
      AND retry_count < ? 
      AND (last_retry_at IS NULL OR last_retry_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE))
      ORDER BY payment_date ASC
    `;
    db.query(sql, [maxRetries], callback);
  }
};

module.exports = Payment;