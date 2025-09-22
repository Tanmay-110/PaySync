import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

const PaymentDetail = () => {
  const { paymentId } = useParams();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPaymentDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getPaymentById(paymentId);
      setPaymentData(response.data);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Failed to fetch payment details');
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchPaymentDetails();
  }, [fetchPaymentDetails]);

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-badge status-pending',
      success: 'status-badge status-success',
      failed: 'status-badge status-failed',
      partial: 'status-badge status-partial',
      refunded: 'status-badge status-refunded',
      cancelled: 'status-badge status-failed'
    };
    return statusClasses[status] || 'status-badge status-pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading payment details...</span>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Payment not found</p>
        <Link to="/payments" className="btn btn-primary mt-4">
          Back to Payments
        </Link>
      </div>
    );
  }

  const { payment, order, refunds, audit_logs } = paymentData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/payments" className="btn btn-secondary btn-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Payment Details</h1>
        </div>
        <button onClick={fetchPaymentDetails} className="btn btn-secondary btn-sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Payment Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Payment ID</dt>
                <dd className="text-sm text-gray-900">#{payment.payment_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                <dd className="text-sm text-gray-900">
                  <Link 
                    to={`/orders/${payment.order_id}`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {payment.order_id}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Amount</dt>
                <dd className="text-sm text-gray-900">${parseFloat(payment.amount).toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Currency</dt>
                <dd className="text-sm text-gray-900">{payment.currency}</dd>
              </div>
            </dl>
          </div>
          <div>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd>
                  <span className={getStatusBadge(payment.status)}>
                    {payment.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Gateway</dt>
                <dd className="text-sm text-gray-900">{payment.gateway_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Gateway ID</dt>
                <dd className="text-sm text-gray-900 font-mono">{payment.gateway_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Payment Date</dt>
                <dd className="text-sm text-gray-900">{new Date(payment.payment_date).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Order Information */}
      {order && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Order Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dl className="space-y-3">
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
                  <dt className="text-sm font-medium text-gray-500">Order Status</dt>
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
      )}

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

      {/* Audit Logs */}
      {audit_logs && audit_logs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Status Change</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {audit_logs.map((log) => (
                  <tr key={log.log_id}>
                    <td>{new Date(log.log_time).toLocaleString()}</td>
                    <td>
                      <span className="status-badge status-pending">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      {log.old_status && log.new_status ? (
                        <span className="text-sm">
                          {log.old_status} → {log.new_status}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {log.details ? (
                        <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          {JSON.stringify(JSON.parse(log.details), null, 2)}
                        </pre>
                      ) : (
                        '-'
                      )}
                    </td>
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

export default PaymentDetail;
