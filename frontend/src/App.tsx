import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DemoNoticeBanner } from './components/DemoNoticeBanner';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BrowseListingsPage } from './pages/BrowseListingsPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { ProviderDashboardPage } from './pages/ProviderDashboardPage';
import { RecipientDashboardPage } from './pages/RecipientDashboardPage';
import { VolunteerDashboardPage } from './pages/VolunteerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <div className="text-3xl">🚫</div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          This section requires one of the following roles: {allowedRoles.join(', ')}. Your active role is{' '}
          <strong>{user.role}</strong>.
        </p>
        <p className="text-xs text-slate-400">
          Tip: Use the Demo Mode banner at the top to switch to an authorized role.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export function AppContent() {
  return (
    <div className="flex flex-col min-h-screen">
      <DemoNoticeBanner />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/listings" element={<BrowseListingsPage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />

          {/* Role specific dashboards */}
          <Route
            path="/provider"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
                <ProviderDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipient"
            element={
              <ProtectedRoute allowedRoles={['RECIPIENT', 'ADMIN']}>
                <RecipientDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer"
            element={
              <ProtectedRoute allowedRoles={['VOLUNTEER', 'ADMIN']}>
                <VolunteerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="/analytics" element={<AnalyticsPage />} />

          {/* Fallback */}
          <Route
            path="*"
            element={
              <div className="py-20 text-center">
                <h2 className="text-2xl font-bold text-slate-800">Page Not Found</h2>
                <p className="text-xs text-slate-500 mt-2">The requested page does not exist.</p>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
