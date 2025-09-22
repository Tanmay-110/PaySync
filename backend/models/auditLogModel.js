const db = require('./db');

const AuditLog = {
  create: (logData, callback) => {
    const sql = 'INSERT INTO payment_audit_log SET ?';
    db.query(sql, logData, callback);
  },
  findByPaymentId: (paymentId, callback) => {
    const sql = 'SELECT * FROM payment_audit_log WHERE payment_id = ? ORDER BY log_time DESC';
    db.query(sql, [paymentId], callback);
  },
  findAll: (callback) => {
    const sql = 'SELECT * FROM payment_audit_log ORDER BY log_time DESC LIMIT 100';
    db.query(sql, callback);
  }
};

module.exports = AuditLog;