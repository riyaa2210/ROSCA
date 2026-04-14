import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BlobBackground from "./ui/BlobBackground";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  FiHome, FiUsers, FiCreditCard, FiBarChart2,
  FiBell, FiUser, FiLogOut, FiShield, FiX,
} from "react-icons/fi";

const NAV = [
  { to: "/dashboard",    icon: FiHome,       label: "Dashboard" },
  { to: "/groups",       icon: FiUsers,      label: "Groups" },
  { to: "/transactions", icon: FiCreditCard, label: "Transactions" },
  { to: "/analytics",    icon: FiBarChart2,  label: "Analytics" },
  { to: "/notifications",icon: FiBell,       label: "Notifications" },
  { to: "/profile",      icon: FiUser,       label: "Profile" },
];

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen animated-bg">
      <BlobBackground />

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-72 z-50 md:hidden
                bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-black text-sm">S</span>
                  </div>
                  <span className="font-black text-gray-900 dark:text-white">SaveSangam</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiX size={18} />
                </button>
              </div>
              <nav className="space-y-1">
                {NAV.map(({ to, icon: Icon, label }) => (
                  <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}>
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                ))}
                {user?.role === "admin" && (
                  <NavLink to="/admin" onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}>
                    <FiShield size={18} /><span>Admin</span>
                  </NavLink>
                )}
              </nav>
              <button onClick={() => { logout(); navigate("/"); }}
                className="sidebar-item w-full text-red-500 hover:bg-red-50 mt-4">
                <FiLogOut size={18} /><span>Logout</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
