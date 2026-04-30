import { createContext, useState, useContext } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('ss_admin');
    return stored ? JSON.parse(stored) : null;
  });

  const [member, setMember] = useState(() => {
    const stored = localStorage.getItem('ss_member');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/admin/login', { email, password });
    localStorage.setItem('ss_token', data.token);
    localStorage.setItem('ss_admin', JSON.stringify({ email: data.email, id: data.adminId }));
    setAdmin({ email: data.email, id: data.adminId });
    setMember(null);
  };

  const logout = () => {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_admin');
    setAdmin(null);
  };

  const memberLogin = async (email, password) => {
    const { data } = await api.post('/auth/member/login', { email, password });
    localStorage.setItem('ss_member_token', data.token);
    localStorage.setItem('ss_member', JSON.stringify({
      memberId: data.memberId,
      name: data.name,
      category: data.category,
    }));
    setMember({ memberId: data.memberId, name: data.name, category: data.category });
    return data;
  };

  const memberLogout = () => {
    localStorage.removeItem('ss_member_token');
    localStorage.removeItem('ss_member');
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{ admin, member, login, logout, memberLogin, memberLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
