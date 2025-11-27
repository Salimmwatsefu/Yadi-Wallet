import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MagicLoginPage from './pages/auth/MagicLoginPage';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KycUploadPage from './pages/kyc/KycUploadPage';
import SettingsPage from './pages/settings/SettingsPage';
import HomePage from './pages/HomePage';
import WalletLayout from './layouts/WalletLayout';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import type { JSX } from 'react';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Helper: Protects routes that require authentication
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-[#FF5500] animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login, but remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Helper: Redirects authenticated users away from public pages (like login)
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-[#FF5500] animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES (Accessible to Everyone) --- */}
        <Route path="/" element={<HomePage />} />
         <Route path="/verify-email" element={<VerifyEmailPage />} />
        
        {/* --- AUTH ROUTES (Only for Guests) --- */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } /> 
        
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />
        
        <Route path="/auth/magic-login" element={<MagicLoginPage />} />

        {/* --- SECURE APP ROUTES (Wrapped in ProtectedRoute & WalletLayout) --- */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <WalletLayout>
              <DashboardPage />
            </WalletLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/kyc" element={
          <ProtectedRoute>
            <WalletLayout>
              <KycUploadPage />
            </WalletLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <WalletLayout>
              <SettingsPage />
            </WalletLayout>
          </ProtectedRoute>
        } />
        
        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;