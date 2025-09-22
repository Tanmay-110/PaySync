const db = require('../models/db');

// Reconcile a payment by invoking the stored procedure to ensure atomic updates and audit logging
const reconcilePayment = (paymentId, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      return callback(err);
    }

    connection.query('CALL sp_reconcile_payment(?)', [paymentId], (procErr) => {
      connection.release();
      if (procErr) {
        return callback(procErr);
      }
      return callback(null, { message: 'Reconciliation completed' });
    });
  });
};

module.exports = { reconcilePayment };
