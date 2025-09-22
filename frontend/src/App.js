import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  BarChart3,
  CreditCard,
  FileText,
  History,
  Home,
  RefreshCw,
  Settings,
  TrendingUp
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Payments from './components/Payments';
import Refunds from './components/Refunds';
import AuditLogs from './components/AuditLogs';
import WebhookSimulator from './components/WebhookSimulator';
import OrderDetail from './components/OrderDetail';
import PaymentDetail from './components/PaymentDetail';

// Services
import { apiService } from './services/apiService';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await apiService.getDashboardStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Orders', href: '/orders', icon: FileText },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Refunds', href: '/refunds', icon: RefreshCw },
    { name: 'Audit Logs', href: '/audit-logs', icon: History },
    { name: 'Webhook Simulator', href: '/webhook-simulator', icon: Settings },
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
          <div className="flex h-16 items-center justify-center border-b border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Payment Recon
              </span>
            </div>
          </div>
          
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main content */}
        <div className="pl-64">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Payment Reconciliation Engine
                </h1>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={fetchDashboardStats}
                    className="btn btn-secondary btn-sm"
                    disabled={isLoading}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="p-6">
            <Routes>
              <Route path="/" element={<Dashboard stats={stats} isLoading={isLoading} />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:orderId" element={<OrderDetail />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/payments/:paymentId" element={<PaymentDetail />} />
              <Route path="/refunds" element={<Refunds />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/webhook-simulator" element={<WebhookSimulator />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
