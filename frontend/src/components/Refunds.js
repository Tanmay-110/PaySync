import React, { useState, useEffect } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

const Refunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRefunds();
      setRefunds(response.data);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast.error('Failed to fetch refunds');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-badge status-pending',
      success: 'status-badge status-success',
      failed: 'status-badge status-failed',
      cancelled: 'status-badge status-failed'
    };
    return statusClasses[status] || 'status-badge status-pending';
  };

  const filteredRefunds = refunds.filter(refund =>
    refund.refund_id.toString().includes(searchTerm) ||
    refund.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.payment_id.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading refunds...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Refunds</h1>
        <button onClick={fetchRefunds} className="btn btn-secondary btn-sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Search refunds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th>Refund ID</th>
                <th>Payment ID</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Refund Date</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredRefunds.map((refund) => (
                <tr key={refund.refund_id}>
                  <td className="font-medium">#{refund.refund_id}</td>
                  <td>#{refund.payment_id}</td>
                  <td>{refund.order_id}</td>
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
    </div>
  );
};

export default Refunds;
