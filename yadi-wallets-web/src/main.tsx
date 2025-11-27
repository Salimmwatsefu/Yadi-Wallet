import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx';


import { GoogleOAuthProvider } from '@react-oauth/google';
const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_ID}>
      <AuthProvider> 
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)