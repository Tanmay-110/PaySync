const request = require('supertest');
const app = require('../app');
const db = require('../models/db');

describe('Payment Reconciliation API', () => {
  beforeAll(async () => {
    // Setup test database
    await new Promise((resolve) => {
      db.query('DELETE FROM payment_audit_log', () => {
        db.query('DELETE FROM refunds', () => {
          db.query('DELETE FROM payments', () => {
            db.query('DELETE FROM orders', resolve);
          });
        });
      });
    });
  });

  afterAll(async () => {
    // Cleanup
    await new Promise((resolve) => {
      db.query('DELETE FROM payment_audit_log', () => {
        db.query('DELETE FROM refunds', () => {
          db.query('DELETE FROM payments', () => {
            db.query('DELETE FROM orders', () => {
              db.end(resolve);
            });
          });
        });
      });
    });
  });

  describe('POST /api/webhook/payment', () => {
    it('should process a successful payment webhook', async () => {
      // First create an order
      const orderData = {
        order_id: 'TEST_ORD_001',
        customer_id: 'TEST_CUST_001',
        customer_email: 'test@example.com',
        total_amount: 100.00,
        currency: 'USD',
        status: 'created'
      };

      await new Promise((resolve) => {
        db.query('INSERT INTO orders SET ?', orderData, resolve);
      });

      const webhookData = {
        order_id: 'TEST_ORD_001',
        amount: 100.00,
        status: 'success',
        gateway_id: 'GATEWAY_TEST_001',
        gateway_name: 'razorpay',
        currency: 'USD'
      };

      const response = await request(app)
        .post('/api/webhook/payment')
        .send(webhookData)
        .expect(200);

      expect(response.body.message).toBe('Webhook processed successfully');
      expect(response.body.payment_id).toBeDefined();
    });

    it('should handle duplicate webhook gracefully', async () => {
      const webhookData = {
        order_id: 'TEST_ORD_001',
        amount: 100.00,
        status: 'success',
        gateway_id: 'GATEWAY_TEST_001',
        gateway_name: 'razorpay',
        currency: 'USD'
      };

      const response = await request(app)
        .post('/api/webhook/payment')
        .send(webhookData)
        .expect(200);

      expect(response.body.message).toBe('Webhook already processed');
    });

    it('should reject webhook for non-existent order', async () => {
      const webhookData = {
        order_id: 'NON_EXISTENT_ORDER',
        amount: 100.00,
        status: 'success',
        gateway_id: 'GATEWAY_TEST_002',
        gateway_name: 'razorpay',
        currency: 'USD'
      };

      const response = await request(app)
        .post('/api/webhook/payment')
        .send(webhookData)
        .expect(404);

      expect(response.body.error).toBe('Order not found');
    });

    it('should validate required fields', async () => {
      const webhookData = {
        order_id: 'TEST_ORD_001',
        // Missing amount, status, gateway_id
      };

      const response = await request(app)
        .post('/api/webhook/payment')
        .send(webhookData)
        .expect(400);

      expect(response.body.error).toContain('Missing required field');
    });
  });

  describe('GET /api/orders', () => {
    it('should return all orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return orders with payment information', async () => {
      const response = await request(app)
        .get('/api/orders?includePayments=true')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('payment_count');
      }
    });
  });

  describe('GET /api/payments', () => {
    it('should return all payments', async () => {
      const response = await request(app)
        .get('/api/payments')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return payments with order information', async () => {
      const response = await request(app)
        .get('/api/payments?includeOrders=true')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('customer_id');
      }
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('orders');
      expect(response.body.stats).toHaveProperty('payments');
      expect(response.body.stats).toHaveProperty('refunds');
    });
  });

  describe('POST /api/refunds', () => {
    it('should process a refund', async () => {
      // First get a successful payment
      const paymentsResponse = await request(app)
        .get('/api/payments?status=success')
        .expect(200);

      if (paymentsResponse.body.length > 0) {
        const payment = paymentsResponse.body[0];
        
        const refundData = {
          paymentId: payment.payment_id,
          amount: 50.00,
          reason: 'Test refund',
          gatewayRefundId: 'RFND_TEST_001'
        };

        const response = await request(app)
          .post('/api/refunds')
          .send(refundData)
          .expect(200);

        expect(response.body.message).toBe('Refund processed successfully');
        expect(response.body.refund_id).toBeDefined();
      }
    });
  });

  describe('GET /api/audit-logs', () => {
    it('should return audit logs with pagination', async () => {
      const response = await request(app)
        .get('/api/audit-logs?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.logs)).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
