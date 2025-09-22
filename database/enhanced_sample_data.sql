USE payment_reconciliation;

-- Insert sample orders
INSERT INTO orders (order_id, customer_id, customer_email, customer_phone, total_amount, currency, status) VALUES
('ORD001', 'CUST001', 'john.doe@example.com', '+1234567890', 100.00, 'USD', 'created'),
('ORD002', 'CUST002', 'jane.smith@example.com', '+1234567891', 250.50, 'USD', 'created'),
('ORD003', 'CUST003', 'bob.johnson@example.com', '+1234567892', 75.25, 'USD', 'created'),
('ORD004', 'CUST004', 'alice.brown@example.com', '+1234567893', 500.00, 'USD', 'created'),
('ORD005', 'CUST005', 'charlie.wilson@example.com', '+1234567894', 150.75, 'USD', 'created');

-- Insert sample payments
INSERT INTO payments (order_id, amount, currency, status, gateway_id, gateway_name, gateway_response) VALUES
('ORD001', 100.00, 'USD', 'success', 'GATEWAY001', 'razorpay', '{"razorpay_payment_id":"pay_1234567890","razorpay_order_id":"order_1234567890"}'),
('ORD002', 125.25, 'USD', 'partial', 'GATEWAY002', 'razorpay', '{"razorpay_payment_id":"pay_1234567891","razorpay_order_id":"order_1234567891"}'),
('ORD003', 75.25, 'USD', 'failed', 'GATEWAY003', 'razorpay', '{"error":"Payment failed due to insufficient funds"}'),
('ORD004', 500.00, 'USD', 'success', 'GATEWAY004', 'stripe', '{"stripe_payment_intent_id":"pi_1234567890","stripe_charge_id":"ch_1234567890"}'),
('ORD005', 150.75, 'USD', 'success', 'GATEWAY005', 'razorpay', '{"razorpay_payment_id":"pay_1234567892","razorpay_order_id":"order_1234567892"}');

-- Insert sample refunds
INSERT INTO refunds (payment_id, order_id, amount, currency, status, reason, gateway_refund_id) VALUES
(1, 'ORD001', 50.00, 'USD', 'success', 'Customer requested partial refund', 'rfnd_1234567890'),
(4, 'ORD004', 500.00, 'USD', 'success', 'Customer cancelled order', 'rfnd_1234567891');

-- Insert sample audit logs
INSERT INTO payment_audit_log (payment_id, order_id, action, old_status, new_status, details) VALUES
(1, 'ORD001', 'create', NULL, 'success', '{"gateway_id":"GATEWAY001","amount":100.00}'),
(2, 'ORD002', 'create', NULL, 'partial', '{"gateway_id":"GATEWAY002","amount":125.25}'),
(3, 'ORD003', 'create', NULL, 'failed', '{"gateway_id":"GATEWAY003","amount":75.25}'),
(4, 'ORD004', 'create', NULL, 'success', '{"gateway_id":"GATEWAY004","amount":500.00}'),
(5, 'ORD005', 'create', NULL, 'success', '{"gateway_id":"GATEWAY005","amount":150.75}'),
(1, 'ORD001', 'reconcile', 'created', 'paid', '{"payment_status":"success","reconciliation_time":"2024-01-15 10:30:00"}'),
(2, 'ORD002', 'reconcile', 'created', 'partially_paid', '{"payment_status":"partial","reconciliation_time":"2024-01-15 10:35:00"}'),
(3, 'ORD003', 'reconcile', 'created', 'payment_failed', '{"payment_status":"failed","reconciliation_time":"2024-01-15 10:40:00"}'),
(4, 'ORD004', 'reconcile', 'created', 'paid', '{"payment_status":"success","reconciliation_time":"2024-01-15 10:45:00"}'),
(5, 'ORD005', 'reconcile', 'created', 'paid', '{"payment_status":"success","reconciliation_time":"2024-01-15 10:50:00"}'),
(1, 'ORD001', 'refund', 'success', 'success', '{"refund_amount":50.00,"reason":"Customer requested partial refund","gateway_refund_id":"rfnd_1234567890"}'),
(4, 'ORD004', 'refund', 'success', 'refunded', '{"refund_amount":500.00,"reason":"Customer cancelled order","gateway_refund_id":"rfnd_1234567891"}');
