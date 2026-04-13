import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Spinner from "./components/Spinner";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import CreateGroupPage from "./pages/CreateGroupPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import JoinGroupPage from "./pages/JoinGroupPage";
import AdminPage from "./pages/AdminPage";
import LandingPage from "./pages/LandingPage";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

import AIChatbot from "./components/AIChatbot";

function AppRoutes() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const hiddenNavRoutes = ["/", "/login", "/register", "/forgot-password"];
  const showNav = !hiddenNavRoutes.includes(pathname) && !pathname.startsWith("/reset-password");

  return (
    <>
      {showNav && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/join/:code" element={<PrivateRoute><JoinGroupPage /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/groups" element={<PrivateRoute><GroupsPage /></PrivateRoute>} />
          <Route path="/groups/create" element={<PrivateRoute><CreateGroupPage /></PrivateRoute>} />
          <Route path="/groups/:id" element={<PrivateRoute><GroupDetailPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="*" element={<div className="flex flex-col items-center justify-center min-h-screen"><span className="text-6xl">404</span><p className="text-gray-500 mt-4">Page not found</p></div>} />
        </Routes>
        {/* AI Chatbot — visible on all authenticated pages */}
        {user && <AIChatbot />}
      </main>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
