import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProviderWrapper } from './components/ui/toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProviderWrapper>
          <App />
        </ToastProviderWrapper>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
