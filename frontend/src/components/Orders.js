import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Search, Filter, RefreshCw } from 'lucide-react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [includePayments, setIncludePayments] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrders({ includePayments });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [includePayments]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <button
          onClick={fetchOrders}
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
                placeholder="Search orders..."
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
              <option value="created">Created</option>
              <option value="paid">Paid</option>
              <option value="payment_failed">Payment Failed</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                checked={includePayments}
                onChange={(e) => setIncludePayments(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">Include Payment Info</span>
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

      {/* Orders Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Total Amount</th>
                <th>Status</th>
                {includePayments && <th>Payment Info</th>}
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredOrders.map((order) => (
                <tr key={order.order_id}>
                  <td className="font-medium">{order.order_id}</td>
                  <td>{order.customer_id}</td>
                  <td>{order.customer_email || '-'}</td>
                  <td>${parseFloat(order.total_amount).toFixed(2)}</td>
                  <td>
                    <span className={getStatusBadge(order.status)}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  {includePayments && (
                    <td>
                      {order.payment_count > 0 ? (
                        <div className="text-sm">
                          <div>{order.payment_count} payment(s)</div>
                          {order.paid_amount > 0 && (
                            <div className="text-green-600">Paid: ${parseFloat(order.paid_amount).toFixed(2)}</div>
                          )}
                          {order.partial_amount > 0 && (
                            <div className="text-blue-600">Partial: ${parseFloat(order.partial_amount).toFixed(2)}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No payments</span>
                      )}
                    </td>
                  )}
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>
                    <Link
                      to={`/orders/${order.order_id}`}
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

        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter ? 'No orders match your filters' : 'No orders found'}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'paid').length}
          </div>
          <div className="text-sm text-gray-600">Paid Orders</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {orders.filter(o => o.status === 'payment_failed').length}
          </div>
          <div className="text-sm text-gray-600">Failed Orders</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {orders.filter(o => o.status === 'refunded').length}
          </div>
          <div className="text-sm text-gray-600">Refunded Orders</div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
