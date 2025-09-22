import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, RefreshCw } from 'lucide-react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  const { orderId } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrderById(orderId);
      setOrderData(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const getStatusBadge = (status) => {
    const statusClasses = {
      created: 'status-badge status-pending',
      paid: 'status-badge status-success',
      payment_failed: 'status-badge status-failed',
      partially_paid: 'status-badge status-partial',
      refunded: 'status-badge status-refunded',
      cancelled: 'status-badge status-failed'
    };
    return statusClasses[status] || 'status-badge status-pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading order details...</span>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Order not found</p>
        <Link to="/orders" className="btn btn-primary mt-4">
          Back to Orders
        </Link>
      </div>
    );
  }

  const { order, payments, refunds } = orderData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/orders" className="btn btn-secondary btn-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Order Details</h1>
        </div>
        <button onClick={fetchOrderDetails} className="btn btn-secondary btn-sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Order Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Order Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                <dd className="text-sm text-gray-900">{order.order_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer ID</dt>
                <dd className="text-sm text-gray-900">{order.customer_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{order.customer_email || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="text-sm text-gray-900">{order.customer_phone || '-'}</dd>
              </div>
            </dl>
          </div>
          <div>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="text-sm text-gray-900">${parseFloat(order.total_amount).toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Currency</dt>
                <dd className="text-sm text-gray-900">{order.currency}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd>
                  <span className={getStatusBadge(order.status)}>
                    {order.status.replace('_', ' ')}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="text-sm text-gray-900">{new Date(order.created_at).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Payments</h3>
        </div>
        {payments && payments.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Gateway</th>
                  <th>Gateway ID</th>
                  <th>Payment Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {payments.map((payment) => (
                  <tr key={payment.payment_id}>
                    <td className="font-medium">#{payment.payment_id}</td>
                    <td>${parseFloat(payment.payment_amount).toFixed(2)}</td>
                    <td>
                      <span className={getStatusBadge(payment.payment_status)}>
                        {payment.payment_status}
                      </span>
                    </td>
                    <td>{payment.gateway_name || '-'}</td>
                    <td className="font-mono text-sm">{payment.gateway_id}</td>
                    <td>{new Date(payment.payment_date).toLocaleString()}</td>
                    <td>
                      <Link
                        to={`/payments/${payment.payment_id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No payments found for this order
          </div>
        )}
      </div>

      {/* Refunds */}
      {refunds && refunds.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Refunds</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Refund ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Refund Date</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {refunds.map((refund) => (
                  <tr key={refund.refund_id}>
                    <td className="font-medium">#{refund.refund_id}</td>
                    <td>${parseFloat(refund.amount).toFixed(2)}</td>
                    <td>
                      <span className={getStatusBadge(refund.status)}>
                        {refund.status}
                      </span>
                    </td>
                    <td>{refund.reason || '-'}</td>
                    <td>{new Date(refund.refund_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
