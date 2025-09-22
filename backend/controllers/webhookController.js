const Payment = require('../models/paymentModel');
const { reconcilePayment } = require('../services/paymentService');

exports.handleWebhook = (req, res) => {
  const signature = req.headers['x-payment-signature'];
  if (!signature) {
    return res.status(401).json({ error: 'Unauthorized: Missing signature' });
  }

  const { order_id, gateway_id, amount, status } = req.body;
  if (!order_id || !gateway_id || !amount || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  Payment.findByGatewayId(gateway_id, (err, existing) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (existing && existing.length > 0) {
      return res.status(200).json({ message: 'Webhook already processed', payment_id: existing[0].payment_id });
    }

    const newPayment = { order_id, amount, status, payment_date: new Date(), gateway_id };
    Payment.create(newPayment, (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(200).json({ message: 'Webhook already processed (duplicate)' });
        return res.status(500).json({ error: 'Internal server error' });
      }

      const paymentId = result.insertId;
      reconcilePayment(paymentId, (reconcileErr) => {
        if (reconcileErr) return res.status(500).json({ error: 'Reconciliation failed' });
        return res.status(200).json({ message: 'Webhook processed successfully', payment_id: paymentId });
      });
    });
  });
};
