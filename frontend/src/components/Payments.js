import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Search, Filter, RefreshCw } from 'lucide-react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [includeOrders, setIncludeOrders] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getPayments({ includeOrders });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [includeOrders]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.payment_id.toString().includes(searchTerm) ||
      payment.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.gateway_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.customer_id && payment.customer_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading payments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
        <button
          onClick={fetchPayments}
          className="btn btn-secondary btn-sm"
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="form-label">Status Filter</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="partial">Partial</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                checked={includeOrders}
                onChange={(e) => setIncludeOrders(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">Include Order Info</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="btn btn-secondary btn-sm w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th>Payment ID</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Gateway</th>
                <th>Gateway ID</th>
                {includeOrders && <th>Customer</th>}
                <th>Payment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredPayments.map((payment) => (
                <tr key={payment.payment_id}>
                  <td className="font-medium">#{payment.payment_id}</td>
                  <td>
                    <Link 
                      to={`/orders/${payment.order_id}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {payment.order_id}
                    </Link>
                  </td>
                  <td>${parseFloat(payment.amount).toFixed(2)}</td>
                  <td>
                    <span className={getStatusBadge(payment.status)}>
                      {payment.status}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {payment.gateway_name || 'Unknown'}
                    </span>
                  </td>
                  <td className="font-mono text-sm">{payment.gateway_id}</td>
                  {includeOrders && (
                    <td>
                      <div className="text-sm">
                        <div>{payment.customer_id}</div>
                        {payment.customer_email && (
                          <div className="text-gray-500">{payment.customer_email}</div>
                        )}
                      </div>
                    </td>
                  )}
                  <td>{new Date(payment.payment_date).toLocaleString()}</td>
                  <td>
                    <Link
                      to={`/payments/${payment.payment_id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter ? 'No payments match your filters' : 'No payments found'}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{payments.length}</div>
          <div className="text-sm text-gray-600">Total Payments</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {payments.filter(p => p.status === 'success').length}
          </div>
          <div className="text-sm text-gray-600">Successful</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {payments.filter(p => p.status === 'failed').length}
          </div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            ${payments
              .filter(p => p.status === 'success')
              .reduce((sum, p) => sum + parseFloat(p.amount), 0)
              .toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Amount</div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
