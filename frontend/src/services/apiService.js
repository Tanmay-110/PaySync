import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Dashboard
  getDashboardStats: () => api.get('/dashboard/stats'),
  getWebhookStats: () => api.get('/webhook/stats'),

  // Orders
  getOrders: (params = {}) => api.get('/orders', { params }),
  getOrderById: (orderId) => api.get(`/orders/${orderId}`),
  getOrdersByStatus: (status) => api.get(`/orders/status/${status}`),

  // Payments
  getPayments: (params = {}) => api.get('/payments', { params }),
  getPaymentById: (paymentId) => api.get(`/payments/${paymentId}`),
  getPaymentsByOrderId: (orderId) => api.get(`/payments/order/${orderId}`),
  getPaymentsByStatus: (status) => api.get(`/payments/status/${status}`),

  // Refunds
  getRefunds: (params = {}) => api.get('/refunds', { params }),
  processRefund: (refundData) => api.post('/refunds', refundData),

  // Audit Logs
  getAuditLogs: (params = {}) => api.get('/audit-logs', { params }),

  // Webhooks
  sendWebhook: (webhookData) => api.post('/webhook/payment', webhookData),
  retryFailedPayments: (params = {}) => api.post('/webhook/retry', params),

  // Health check
  healthCheck: () => api.get('/health'),
};

export default api;
