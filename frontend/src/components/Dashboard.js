import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  FileText,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Settings
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

const Dashboard = ({ stats, isLoading }) => {
  const [chartData, setChartData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
    fetchRecentActivity();
  }, []);

  const fetchChartData = async () => {
    try {
      const [ordersResponse, paymentsResponse] = await Promise.all([
        apiService.getOrders(),
        apiService.getPayments()
      ]);

      // Process data for charts
      const orders = ordersResponse.data;
      const payments = paymentsResponse.data;

      // Group by date for line chart
      const dateGroups = {};
      orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString();
        if (!dateGroups[date]) {
          dateGroups[date] = { date, orders: 0, payments: 0, amount: 0 };
        }
        dateGroups[date].orders++;
        dateGroups[date].amount += parseFloat(order.total_amount);
      });

      payments.forEach(payment => {
        const date = new Date(payment.payment_date).toLocaleDateString();
        if (!dateGroups[date]) {
          dateGroups[date] = { date, orders: 0, payments: 0, amount: 0 };
        }
        dateGroups[date].payments++;
      });

      setChartData(Object.values(dateGroups).slice(-7)); // Last 7 days
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast.error('Failed to fetch chart data');
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await apiService.getAuditLogs({ limit: 10 });
      setRecentActivity(response.data.logs);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      toast.error('Failed to fetch recent activity');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, change, changeType }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
              {changeType === 'increase' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {change}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={stats?.orders?.total_orders || 0}
          icon={FileText}
          color="bg-blue-500"
          change="+12%"
          changeType="increase"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats?.orders?.paid_order_value || 0}`}
          icon={DollarSign}
          color="bg-green-500"
          change="+8%"
          changeType="increase"
        />
        <StatCard
          title="Successful Payments"
          value={stats?.payments?.successful_payments || 0}
          icon={CreditCard}
          color="bg-purple-500"
          change="+5%"
          changeType="increase"
        />
        <StatCard
          title="Total Refunds"
          value={stats?.refunds?.total_refunds || 0}
          icon={RefreshCw}
          color="bg-orange-500"
          change="-2%"
          changeType="decrease"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders and Payments Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Orders & Payments Trend</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#3B82F6" name="Orders" />
                <Bar dataKey="payments" fill="#10B981" name="Payments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Payment Status Distribution</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Success', value: stats?.payments?.successful_payments || 0 },
                    { name: 'Failed', value: stats?.payments?.failed_payments || 0 },
                    { name: 'Partial', value: stats?.payments?.partial_payments || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1, 2].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Payment ID</th>
                <th>Order ID</th>
                <th>Status Change</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {(recentActivity || []).map((log) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(recentActivity || []).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No recent activity found
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/webhook-simulator'}
            className="btn btn-primary"
          >
            <Settings className="h-4 w-4 mr-2" />
            Simulate Webhook
          </button>
          <button
            onClick={fetchRecentActivity}
            className="btn btn-secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
          <button
            onClick={() => window.location.href = '/audit-logs'}
            className="btn btn-secondary"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            View All Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
