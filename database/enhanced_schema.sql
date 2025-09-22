-- Enhanced Payment Reconciliation Database Schema
-- Drop existing objects if they exist
DROP PROCEDURE IF EXISTS sp_reconcile_payment;
DROP PROCEDURE IF EXISTS sp_process_refund;
DROP TRIGGER IF EXISTS payment_update_trigger;
DROP TRIGGER IF EXISTS refund_create_trigger;
DROP TABLE IF EXISTS refunds;
DROP TABLE IF EXISTS payment_audit_log;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS orders;

-- Create database
CREATE DATABASE IF NOT EXISTS payment_reconciliation;
USE payment_reconciliation;

-- Table: orders
CREATE TABLE orders (
    order_id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('created', 'paid', 'payment_failed', 'partially_paid', 'refunded', 'cancelled') DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Table: payments
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('pending', 'success', 'failed', 'partial', 'refunded', 'cancelled') NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gateway_id VARCHAR(255) UNIQUE,
    gateway_name VARCHAR(50) DEFAULT 'razorpay',
    gateway_response JSON,
    retry_count INT DEFAULT 0,
    last_retry_at TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_gateway_id (gateway_id),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date)
);

-- Table: refunds
CREATE TABLE refunds (
    refund_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('pending', 'success', 'failed', 'cancelled') NOT NULL,
    reason VARCHAR(255),
    gateway_refund_id VARCHAR(255) UNIQUE,
    refund_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX idx_payment_id (payment_id),
    INDEX idx_order_id (order_id),
    INDEX idx_status (status)
);

-- Table: payment_audit_log
CREATE TABLE payment_audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT,
    order_id VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    details JSON,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    INDEX idx_payment_id (payment_id),
    INDEX idx_order_id (order_id),
    INDEX idx_action (action),
    INDEX idx_log_time (log_time)
);

-- Stored Procedure: sp_reconcile_payment
DELIMITER $$
CREATE PROCEDURE sp_reconcile_payment(IN p_payment_id INT)
BEGIN
    DECLARE v_order_id VARCHAR(255);
    DECLARE v_payment_status VARCHAR(50);
    DECLARE v_order_status VARCHAR(50);
    DECLARE v_new_order_status VARCHAR(50);
    DECLARE v_old_order_status VARCHAR(50);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Get payment details with lock
    SELECT order_id, status INTO v_order_id, v_payment_status 
    FROM payments WHERE payment_id = p_payment_id FOR UPDATE;
    
    IF v_order_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment not found';
    END IF;
    
    -- Get order details with lock
    SELECT status INTO v_order_status 
    FROM orders WHERE order_id = v_order_id FOR UPDATE;
    
    IF v_order_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order not found';
    END IF;
    
    SET v_old_order_status = v_order_status;
    
    -- Determine new status based on payment status
    CASE v_payment_status
        WHEN 'success' THEN SET v_new_order_status = 'paid';
        WHEN 'failed' THEN SET v_new_order_status = 'payment_failed';
        WHEN 'partial' THEN SET v_new_order_status = 'partially_paid';
        WHEN 'refunded' THEN SET v_new_order_status = 'refunded';
        WHEN 'cancelled' THEN SET v_new_order_status = 'cancelled';
        ELSE SET v_new_order_status = v_order_status;
    END CASE;

    -- Update order status
    UPDATE orders SET status = v_new_order_status WHERE order_id = v_order_id;
    
    -- Insert audit log
    INSERT INTO payment_audit_log (payment_id, order_id, action, old_status, new_status, details)
    VALUES (p_payment_id, v_order_id, 'reconcile', v_old_order_status, v_new_order_status, 
            JSON_OBJECT('payment_status', v_payment_status, 'reconciliation_time', NOW()));

    COMMIT;
END$$
DELIMITER ;

-- Stored Procedure: sp_process_refund
DELIMITER $$
CREATE PROCEDURE sp_process_refund(
    IN p_payment_id INT,
    IN p_refund_amount DECIMAL(10,2),
    IN p_reason VARCHAR(255),
    IN p_gateway_refund_id VARCHAR(255)
)
BEGIN
    DECLARE v_order_id VARCHAR(255);
    DECLARE v_payment_amount DECIMAL(10,2);
    DECLARE v_payment_status VARCHAR(50);
    DECLARE v_refund_status VARCHAR(50);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Get payment details
    SELECT order_id, amount, status INTO v_order_id, v_payment_amount, v_payment_status
    FROM payments WHERE payment_id = p_payment_id FOR UPDATE;
    
    IF v_order_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment not found';
    END IF;
    
    -- Validate refund amount
    IF p_refund_amount > v_payment_amount THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Refund amount cannot exceed payment amount';
    END IF;
    
    -- Determine refund status based on payment status
    IF v_payment_status = 'success' THEN
        SET v_refund_status = 'success';
    ELSE
        SET v_refund_status = 'failed';
    END IF;
    
    -- Create refund record
    INSERT INTO refunds (payment_id, order_id, amount, reason, gateway_refund_id, status, processed_at)
    VALUES (p_payment_id, v_order_id, p_refund_amount, p_reason, p_gateway_refund_id, v_refund_status, NOW());
    
    -- Return the newly created refund id
    SELECT LAST_INSERT_ID() AS refund_id;
    
    -- Update payment status if full refund
    IF p_refund_amount = v_payment_amount THEN
        UPDATE payments SET status = 'refunded' WHERE payment_id = p_payment_id;
        UPDATE orders SET status = 'refunded' WHERE order_id = v_order_id;
    END IF;
    
    -- Insert audit log
    INSERT INTO payment_audit_log (payment_id, order_id, action, old_status, new_status, details)
    VALUES (p_payment_id, v_order_id, 'refund', v_payment_status, 
            CASE WHEN p_refund_amount = v_payment_amount THEN 'refunded' ELSE v_payment_status END,
            JSON_OBJECT('refund_amount', p_refund_amount, 'reason', p_reason, 'gateway_refund_id', p_gateway_refund_id));

    COMMIT;
END$$
DELIMITER ;

-- Trigger: payment_update_trigger
DELIMITER $$
CREATE TRIGGER payment_update_trigger
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    INSERT INTO payment_audit_log (payment_id, order_id, action, old_status, new_status, details)
    VALUES (NEW.payment_id, NEW.order_id, 'update', OLD.status, NEW.status, 
            JSON_OBJECT('update_time', NOW(), 'gateway_id', NEW.gateway_id));
END$$
DELIMITER ;

-- Trigger: refund_create_trigger
DELIMITER $$
CREATE TRIGGER refund_create_trigger
AFTER INSERT ON refunds
FOR EACH ROW
BEGIN
    INSERT INTO payment_audit_log (payment_id, order_id, action, old_status, new_status, details)
    VALUES (NEW.payment_id, NEW.order_id, 'refund_created', 'active', NEW.status,
            JSON_OBJECT('refund_amount', NEW.amount, 'reason', NEW.reason, 'gateway_refund_id', NEW.gateway_refund_id));
END$$
DELIMITER ;
