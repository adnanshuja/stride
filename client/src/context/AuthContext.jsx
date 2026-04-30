import { createContext, useState, useContext } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('ss_admin');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/admin/login', { email, password });
    localStorage.setItem('ss_token', data.token);
    localStorage.setItem('ss_admin', JSON.stringify({ email: data.email, id: data.adminId }));
    setAdmin({ email: data.email, id: data.adminId });
  };

  const logout = () => {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_admin');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
