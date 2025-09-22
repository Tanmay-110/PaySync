import React, { useState, useEffect, useCallback } from 'react';
import { Send, RefreshCw, Copy, Check } from 'lucide-react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

const WebhookSimulator = () => {
  const [formData, setFormData] = useState({
    order_id: '',
    amount: '',
    status: 'success',
    gateway_id: '',
    gateway_name: 'razorpay',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [copied, setCopied] = useState(false);
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await apiService.getOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const generateSampleData = useCallback(() => {
    const sampleOrder = orders[Math.floor(Math.random() * orders.length)];
    if (sampleOrder) {
      setFormData({
        order_id: sampleOrder.order_id,
        amount: sampleOrder.total_amount,
        status: 'success',
        gateway_id: `GATEWAY_${Date.now()}`,
        gateway_name: 'razorpay',
        currency: 'USD'
      });
    }
  }, [orders]);

  useEffect(() => {
    fetchOrders();
    generateSampleData();
  }, [generateSampleData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const webhookPayload = {
        ...formData,
        amount: parseFloat(formData.amount),
        gateway_response: {
          razorpay_payment_id: formData.gateway_id,
          razorpay_order_id: formData.order_id,
          status: formData.status
        }
      };

      const result = await apiService.sendWebhook(webhookPayload);
      setResponse(result.data);
      toast.success('Webhook sent successfully!');
      
      // Reset form
      generateSampleData();
    } catch (error) {
      console.error('Error sending webhook:', error);
      toast.error(error.response?.data?.error || 'Failed to send webhook');
      setResponse({ error: error.response?.data?.error || 'Failed to send webhook' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const sampleWebhooks = [
    {
      name: 'Successful Payment',
      data: {
        order_id: 'ORD001',
        amount: 100.00,
        status: 'success',
        gateway_id: 'GATEWAY_SUCCESS_001',
        gateway_name: 'razorpay',
        currency: 'USD'
      }
    },
    {
      name: 'Failed Payment',
      data: {
        order_id: 'ORD002',
        amount: 250.50,
        status: 'failed',
        gateway_id: 'GATEWAY_FAILED_001',
        gateway_name: 'razorpay',
        currency: 'USD'
      }
    },
    {
      name: 'Partial Payment',
      data: {
        order_id: 'ORD003',
        amount: 125.25,
        status: 'partial',
        gateway_id: 'GATEWAY_PARTIAL_001',
        gateway_name: 'stripe',
        currency: 'USD'
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Webhook Simulator</h1>
        <button
          onClick={generateSampleData}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate Sample
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webhook Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Send Webhook</h3>
            <p className="text-sm text-gray-600">Simulate a payment webhook from external gateways</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Order ID</label>
              <select
                name="order_id"
                value={formData.order_id}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="">Select an order</option>
                {orders.map(order => (
                  <option key={order.order_id} value={order.order_id}>
                    {order.order_id} - ${order.total_amount}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="form-input"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="form-label">Gateway ID</label>
              <input
                type="text"
                name="gateway_id"
                value={formData.gateway_id}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Gateway Name</label>
              <select
                name="gateway_name"
                value={formData.gateway_name}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="square">Square</option>
              </select>
            </div>

            <div>
              <label className="form-label">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Webhook
                </>
              )}
            </button>
          </form>
        </div>

        {/* Response */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Response</h3>
            {response && (
              <button
                onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                className="btn btn-secondary btn-sm"
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
            {response ? (
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Send a webhook to see the response here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sample Webhooks */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Sample Webhooks</h3>
          <p className="text-sm text-gray-600">Click to use these sample webhook payloads</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleWebhooks.map((sample, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{sample.name}</h4>
              <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-3 overflow-x-auto">
                {JSON.stringify(sample.data, null, 2)}
              </pre>
              <button
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    ...sample.data,
                    gateway_id: `${sample.data.gateway_id}_${Date.now()}`
                  }));
                  toast.success('Sample data loaded!');
                }}
                className="btn btn-secondary btn-sm w-full"
              >
                Use This Sample
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Documentation */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Webhook Documentation</h3>
        </div>

        <div className="prose max-w-none">
          <h4>Endpoint</h4>
          <code className="bg-gray-100 px-2 py-1 rounded">POST /api/webhook/payment</code>

          <h4>Required Headers</h4>
          <ul>
            <li><code>Content-Type: application/json</code></li>
            <li><code>X-Payment-Signature: [signature]</code> (for production)</li>
          </ul>

          <h4>Required Fields</h4>
          <ul>
            <li><code>order_id</code> - The order identifier</li>
            <li><code>amount</code> - Payment amount (number)</li>
            <li><code>status</code> - Payment status (success, failed, partial, pending)</li>
            <li><code>gateway_id</code> - Unique gateway transaction ID</li>
          </ul>

          <h4>Optional Fields</h4>
          <ul>
            <li><code>gateway_name</code> - Payment gateway name (default: razorpay)</li>
            <li><code>currency</code> - Currency code (default: USD)</li>
            <li><code>gateway_response</code> - Additional gateway response data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WebhookSimulator;
