import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

// 1. Define Types
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  // 2. Initialize from LocalStorage (Instant Load)
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('yadi-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  const [loading, setLoading] = useState(false);

  // 3. Sync with Server on Mount (If Logged In)
  useEffect(() => {
    const fetchUserTheme = async () => {
        try {
            // We assume you have a way to know if logged in (e.g. check cookie or AuthContext)
            // For now, we just try. If 401/403, we ignore.
            const { data } = await api.get('/api/users/profile/'); 
            if (data.theme_preference && data.theme_preference !== theme) {
                setTheme(data.theme_preference);
            }
        } catch (err) {
            // Not logged in or network error - keep using local preference
        }
    };
    fetchUserTheme();
  }, []);

  // 4. Apply Theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('yadi-theme', theme);
  }, [theme]);

  // 5. Toggle & Save to Server
  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    // Optimistic Update (Change UI immediately)
    setTheme(newTheme); 
    
    try {
        // Background Sync
        await api.patch('/api/users/profile/', { theme_preference: newTheme });
    } catch (err) {
        console.error("Failed to sync theme preference");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};