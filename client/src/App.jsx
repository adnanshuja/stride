import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MemberPage from './pages/MemberPage';
import HistoryPage from './pages/HistoryPage';
import SignupPage from './pages/SignupPage';

function ProtectedRoute({ children }) {
  const { admin } = useAuth();
  return admin ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/member/:memberId" element={<MemberPage />} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
    </Routes>
  );
}
