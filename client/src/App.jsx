import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppLayout from "./components/AppLayout";
import Spinner from "./components/Spinner";

import LandingPage       from "./pages/LandingPage";
import LoginPage         from "./pages/LoginPage";
import RegisterPage      from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage     from "./pages/DashboardPage";
import GroupsPage        from "./pages/GroupsPage";
import GroupDetailPage   from "./pages/GroupDetailPage";
import CreateGroupPage   from "./pages/CreateGroupPage";
import ProfilePage       from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import JoinGroupPage     from "./pages/JoinGroupPage";
import AdminPage         from "./pages/AdminPage";
import TransactionsPage  from "./pages/TransactionsPage";
import AnalyticsPage     from "./pages/AnalyticsPage";
import AIChatbot         from "./components/AIChatbot";

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

// Pages that use the app shell (sidebar + topbar)
const APP_ROUTES = [
  { path: "/dashboard",    el: <DashboardPage /> },
  { path: "/groups",       el: <GroupsPage /> },
  { path: "/groups/create",el: <CreateGroupPage /> },
  { path: "/groups/:id",   el: <GroupDetailPage /> },
  { path: "/transactions", el: <TransactionsPage /> },
  { path: "/analytics",    el: <AnalyticsPage /> },
  { path: "/notifications",el: <NotificationsPage /> },
  { path: "/profile",      el: <ProfilePage /> },
];

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes — no shell */}
        <Route path="/"                      element={<LandingPage />} />
        <Route path="/login"                 element={<LoginPage />} />
        <Route path="/register"              element={<RegisterPage />} />
        <Route path="/forgot-password"       element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/join/:code"            element={<PrivateRoute><JoinGroupPage /></PrivateRoute>} />

        {/* App shell routes */}
        {APP_ROUTES.map(({ path, el }) => (
          <Route key={path} path={path} element={
            <PrivateRoute>
              <AppLayout>{el}</AppLayout>
            </PrivateRoute>
          } />
        ))}

        {/* Admin */}
        <Route path="/admin" element={
          <AdminRoute>
            <AppLayout><AdminPage /></AppLayout>
          </AdminRoute>
        } />

        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-screen">
            <span className="text-7xl font-black text-gray-200 dark:text-gray-800">404</span>
            <p className="text-gray-500 mt-4">Page not found</p>
          </div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <AIChatbot />
      </AuthProvider>
    </ThemeProvider>
  );
}
