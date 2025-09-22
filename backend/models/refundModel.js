const db = require('./db');

const Refund = {
  create: (refundData, callback) => {
    const sql = 'INSERT INTO refunds SET ?';
    db.query(sql, refundData, callback);
  },
  
  findById: (refundId, callback) => {
    const sql = 'SELECT * FROM refunds WHERE refund_id = ?';
    db.query(sql, [refundId], callback);
  },
  
  findByPaymentId: (paymentId, callback) => {
    const sql = 'SELECT * FROM refunds WHERE payment_id = ? ORDER BY refund_date DESC';
    db.query(sql, [paymentId], callback);
  },
  
  findByOrderId: (orderId, callback) => {
    const sql = 'SELECT * FROM refunds WHERE order_id = ? ORDER BY refund_date DESC';
    db.query(sql, [orderId], callback);
  },
  
  findByGatewayRefundId: (gatewayRefundId, callback) => {
    const sql = 'SELECT * FROM refunds WHERE gateway_refund_id = ?';
    db.query(sql, [gatewayRefundId], callback);
  },
  
  findAll: (callback) => {
    const sql = 'SELECT * FROM refunds ORDER BY refund_date DESC';
    db.query(sql, callback);
  },
  
  updateStatus: (refundId, status, callback) => {
    const sql = 'UPDATE refunds SET status = ?, processed_at = NOW() WHERE refund_id = ?';
    db.query(sql, [status, refundId], callback);
  },
  
  getRefundSummary: (callback) => {
    const sql = `
      SELECT 
        COUNT(*) as total_refunds,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_refunds,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_refunds,
        SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_refunded_amount
      FROM refunds
    `;
    db.query(sql, callback);
  }
};

module.exports = Refund;
