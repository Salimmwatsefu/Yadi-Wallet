import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Helper to decide where to send the user
const RootGate = () => {
  const { user, loading } = useAuth();
  
  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
  );
  
  if (user) return <Navigate to="/dashboard" replace />;
  
  return <HomePage />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES (No Layout) --- */}
        <Route path="/" element={<RootGate />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} /> 
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/magic-login" element={<MagicLoginPage />} />

        {/* --- SECURE APP ROUTES (Wrapped in WalletLayout) --- */}
        <Route path="/dashboard" element={<WalletLayout><DashboardPage /></WalletLayout>} />
        <Route path="/kyc" element={<WalletLayout><KycUploadPage /></WalletLayout>} />
        <Route path="/settings" element={<WalletLayout><SettingsPage /></WalletLayout>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />

        
      </Routes>
    </Router>
  );
}

export default App;