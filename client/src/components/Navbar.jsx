import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { FiBell, FiMoon, FiSun, FiMenu, FiX } from "react-icons/fi";
import { useState } from "react";
import i18n from "../i18n";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleLang = () => {
    const next = i18n.language === "en" ? "mr" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-xl text-primary-600">Bhishi</span>
          </Link>

          {/* Desktop nav */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 font-medium">
                {t("dashboard")}
              </Link>
              <Link to="/groups" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 font-medium">
                {t("groups")}
              </Link>
              <Link to="/transactions" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 font-medium">
                Transactions
              </Link>
              <Link to="/analytics" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 font-medium">
                Analytics
              </Link>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="text-xs font-semibold px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
              {i18n.language === "en" ? "मर" : "EN"}
            </button>
            <button onClick={toggleDark} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            {user && (
              <>
                <Link to="/notifications" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiBell size={18} />
                </Link>
                <Link to="/profile">
                  <img
                    src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </Link>
                <button onClick={handleLogout} className="hidden md:block text-sm text-gray-500 hover:text-red-500">
                  {t("logout")}
                </button>
              </>
            )}
            {!user && (
              <Link to="/login" className="btn-primary text-sm">
                {t("login")}
              </Link>
            )}
            {/* Mobile menu toggle */}
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && user && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-2">
          <Link to="/dashboard" className="block py-2 text-gray-700 dark:text-gray-300" onClick={() => setMenuOpen(false)}>{t("dashboard")}</Link>
          <Link to="/groups" className="block py-2 text-gray-700 dark:text-gray-300" onClick={() => setMenuOpen(false)}>{t("groups")}</Link>
          <Link to="/transactions" className="block py-2 text-gray-700 dark:text-gray-300" onClick={() => setMenuOpen(false)}>Transactions</Link>
          <Link to="/analytics" className="block py-2 text-gray-700 dark:text-gray-300" onClick={() => setMenuOpen(false)}>Analytics</Link>
          <Link to="/profile" className="block py-2 text-gray-700 dark:text-gray-300" onClick={() => setMenuOpen(false)}>{t("profile")}</Link>
          <button onClick={handleLogout} className="block py-2 text-red-500 w-full text-left">{t("logout")}</button>
        </div>
      )}
    </nav>
  );
}
