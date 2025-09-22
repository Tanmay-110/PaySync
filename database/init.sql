-- Create database
CREATE DATABASE IF NOT EXISTS payment_reconciliation;
USE payment_reconciliation;

-- Table: orders
CREATE TABLE orders (
    order_id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('created', 'paid', 'payment_failed', 'partially_paid', 'refunded') DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: payments
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'success', 'failed', 'partial', 'refunded') NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gateway_id VARCHAR(255) UNIQUE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- Table: payment_audit_log
CREATE TABLE payment_audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE
);

-- Stored Procedure: sp_reconcile_payment
DELIMITER $$
CREATE PROCEDURE sp_reconcile_payment(IN p_payment_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Get payment details with lock
    SELECT * FROM payments WHERE payment_id = p_payment_id INTO @payment FOR UPDATE;
    
    -- Get order details with lock
    SELECT * FROM orders WHERE order_id = @payment.order_id INTO @order FOR UPDATE;
    
    -- Determine new status based on payment status
    IF @payment.status = 'success' THEN
        SET @new_order_status = 'paid';
    ELSEIF @payment.status = 'failed' THEN
        SET @new_order_status = 'payment_failed';
    ELSEIF @payment.status = 'partial' THEN
        SET @new_order_status = 'partially_paid';
    ELSE
        SET @new_order_status = @order.status;
    END IF;

    -- Update order status
    UPDATE orders SET status = @new_order_status WHERE order_id = @order.order_id;
    
    -- Insert audit log
    INSERT INTO payment_audit_log (payment_id, action, old_status, new_status)
    VALUES (p_payment_id, 'reconcile', @order.status, @new_order_status);

    COMMIT;
END$$
DELIMITER ;

-- Trigger: payment_update_trigger
DELIMITER $$
CREATE TRIGGER payment_update_trigger
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    INSERT INTO payment_audit_log (payment_id, action, old_status, new_status)
    VALUES (NEW.payment_id, 'update', OLD.status, NEW.status);
END$$
DELIMITER ;