import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FiSun, FiMoon, FiBell, FiMenu } from "react-icons/fi";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import i18n from "../i18n";

export default function TopBar({ onMenuOpen }) {
  const { user } = useAuth();
  const { dark, toggleDark } = useTheme();
  const [langOpen, setLangOpen] = useState(false);

  const toggleLang = () => {
    const next = i18n.language === "en" ? "mr" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
    setLangOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between
      px-4 sm:px-6 h-16
      bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl
      border-b border-gray-100 dark:border-gray-800/60">

      {/* Mobile menu button */}
      <button onClick={onMenuOpen} className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
        <FiMenu size={20} />
      </button>

      {/* Page title placeholder — filled by each page */}
      <div className="hidden md:block" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button onClick={toggleLang}
          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700
            bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300
            hover:border-brand-300 transition-colors">
          {i18n.language === "en" ? "मर" : "EN"}
        </button>

        {/* Dark mode */}
        <motion.button onClick={toggleDark} whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
          <AnimatePresence mode="wait">
            <motion.div key={dark ? "sun" : "moon"}
              initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}>
              {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Notifications */}
        <Link to="/notifications"
          className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
          <FiBell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-saffron-500 rounded-full ring-2 ring-white dark:ring-gray-950" />
        </Link>

        {/* Avatar */}
        <Link to="/profile">
          <motion.img whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
            src={user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=6366f1&color=fff&bold=true`}
            alt={user?.name}
            className="w-9 h-9 rounded-2xl object-cover ring-2 ring-brand-200 dark:ring-brand-800 cursor-pointer" />
        </Link>
      </div>
    </header>
  );
}
