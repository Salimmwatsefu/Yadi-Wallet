import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

interface User {
  id: string;
  username: string;
  email: string;
  theme_preference: string;
  is_kyc_verified: boolean;
}

// --- DEFINING THE MISSING METHODS ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  
  // Authentication Methods
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Utility
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Check User Session
  const checkAuth = async () => {
    try {
      // We use the profile endpoint to get user details if the session cookie is valid
      const response = await api.get('/api/users/profile/');
      setUser(response.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Run check on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // 2. Standard Login
  const login = async (data: any) => {
      // This sets the HttpOnly cookie
      await api.post('/api/auth/login/', data);
      // Refresh user state
      await checkAuth();
  };

  // 3. Registration
  const register = async (data: any) => {
      await api.post('/api/auth/registration/', data);
      // dj-rest-auth usually logs you in automatically after registration
      await checkAuth();
  };

  // 4. Google Login
  const loginWithGoogle = async (token: string) => {
      await api.post('/api/auth/google/', {
          access_token: token,
      });
      await checkAuth();
  };

  // 5. Logout
  const logout = async () => {
      try {
          await api.post('/api/auth/logout/');
      } catch (e) {
          console.error(e);
      } finally {
          setUser(null);
          // Optional: Hard reload to clear any in-memory states
          window.location.href = '/login'; 
      }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};