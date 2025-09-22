import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getAuditLogs({ 
        page: currentPage, 
        limit: 50 
      });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.payment_id?.toString().includes(searchTerm) ||
    log.order_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading audit logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
        <button onClick={fetchLogs} className="btn btn-secondary btn-sm">
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
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Payment ID</th>
                <th>Order ID</th>
                <th>Status Change</th>
                <th>Customer</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredLogs.map((log) => (
                <tr key={log.log_id}>
                  <td>{new Date(log.log_time).toLocaleString()}</td>
                  <td>
                    <span className="status-badge status-pending">
                      {log.action}
                    </span>
                  </td>
                  <td>{log.payment_id || '-'}</td>
                  <td>{log.order_id || '-'}</td>
                  <td>
                    {log.old_status && log.new_status ? (
                      <span className="text-sm">
                        {log.old_status} → {log.new_status}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{log.customer_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
