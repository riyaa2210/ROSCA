import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  FiHome, FiUsers, FiCreditCard, FiBarChart2,
  FiBell, FiUser, FiLogOut, FiChevronLeft, FiChevronRight,
  FiShield,
} from "react-icons/fi";
import { useState } from "react";

const NAV = [
  { to: "/dashboard",    icon: FiHome,      label: "dashboard",    labelMr: "डॅशबोर्ड" },
  { to: "/groups",       icon: FiUsers,     label: "groups",       labelMr: "गट" },
  { to: "/transactions", icon: FiCreditCard,label: "transactions", labelMr: "व्यवहार" },
  { to: "/analytics",    icon: FiBarChart2, label: "analytics",    labelMr: "विश्लेषण" },
  { to: "/notifications",icon: FiBell,      label: "notifications",labelMr: "सूचना" },
  { to: "/profile",      icon: FiUser,      label: "profile",      labelMr: "प्रोफाइल" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t, i18n }      = useTranslation();
  const navigate         = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const isMr = i18n.language === "mr";

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="hidden md:flex flex-col h-screen sticky top-0
        bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl
        border-r border-gray-100 dark:border-gray-800/60
        z-30 overflow-hidden flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800/60">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-200 dark:shadow-brand-900/40">
          <span className="text-white font-black text-sm">S</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
              <p className="font-black text-gray-900 dark:text-white text-base leading-none">SaveSangam</p>
              <p className="text-[10px] text-brand-500 font-medium mt-0.5">
                {isMr ? "एकत्र बचत करा" : "Save Together"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {NAV.map(({ to, icon: Icon, label, labelMr }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
          >
            <Icon size={18} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  className={isMr ? "font-devan text-sm" : ""}>
                  {isMr ? labelMr : t(label)}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {user?.role === "admin" && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}>
            <FiShield size={18} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Admin</motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        )}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800/60 space-y-1">
        <button onClick={handleLogout}
          className="sidebar-item w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
          <FiLogOut size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {isMr ? "बाहेर पडा" : "Logout"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed((c) => !c)}
          className="sidebar-item w-full justify-center text-gray-400">
          {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}
