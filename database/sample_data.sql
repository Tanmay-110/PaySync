USE payment_reconciliation;

-- Insert sample orders
INSERT INTO orders (order_id, customer_id, total_amount, status) VALUES
('ORD001', 'CUST001', 100.00, 'created'),
('ORD002', 'CUST002', 250.50, 'created'),
('ORD003', 'CUST003', 75.25, 'created');

-- Insert sample payments
INSERT INTO payments (order_id, amount, status, gateway_id) VALUES
('ORD001', 100.00, 'success', 'GATEWAY001'),
('ORD002', 125.25, 'partial', 'GATEWAY002'),
('ORD003', 75.25, 'failed', 'GATEWAY003');

-- Insert sample audit logs
INSERT INTO payment_audit_log (payment_id, action, old_status, new_status) VALUES
(1, 'create', NULL, 'success'),
(2, 'create', NULL, 'partial'),
(3, 'create', NULL, 'failed');