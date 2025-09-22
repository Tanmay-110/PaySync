const db = require('./db');

const Order = {
  create: (orderData, callback) => {
    const sql = 'INSERT INTO orders SET ?';
    db.query(sql, orderData, callback);
  },
  
  findById: (orderId, callback) => {
    const sql = 'SELECT * FROM orders WHERE order_id = ?';
    db.query(sql, [orderId], callback);
  },
  
  findByIdWithPayments: (orderId, callback) => {
    const sql = `
      SELECT 
        o.*,
        p.payment_id,
        p.amount as payment_amount,
        p.status as payment_status,
        p.payment_date,
        p.gateway_id,
        p.gateway_name
      FROM orders o
      LEFT JOIN payments p ON o.order_id = p.order_id
      WHERE o.order_id = ?
      ORDER BY p.payment_date DESC
    `;
    db.query(sql, [orderId], callback);
  },
  
  updateStatus: (orderId, status, callback) => {
    const sql = 'UPDATE orders SET status = ? WHERE order_id = ?';
    db.query(sql, [status, orderId], callback);
  },
  
  findAll: (callback) => {
    const sql = 'SELECT * FROM orders ORDER BY created_at DESC';
    db.query(sql, callback);
  },
  
  findAllWithPayments: (callback) => {
    const sql = `
      SELECT 
        o.*,
        COUNT(p.payment_id) as payment_count,
        SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN p.status = 'partial' THEN p.amount ELSE 0 END) as partial_amount
      FROM orders o
      LEFT JOIN payments p ON o.order_id = p.order_id
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
    `;
    db.query(sql, callback);
  },
  
  getOrdersByStatus: (status, callback) => {
    const sql = 'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC';
    db.query(sql, [status], callback);
  },
  
  getOrderSummary: (callback) => {
    const sql = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
        SUM(CASE WHEN status = 'payment_failed' THEN 1 ELSE 0 END) as failed_orders,
        SUM(CASE WHEN status = 'partially_paid' THEN 1 ELSE 0 END) as partial_orders,
        SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refunded_orders,
        SUM(total_amount) as total_order_value,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_order_value
      FROM orders
    `;
    db.query(sql, callback);
  },
  
  getOrdersByCustomer: (customerId, callback) => {
    const sql = 'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC';
    db.query(sql, [customerId], callback);
  }
};

module.exports = Order;