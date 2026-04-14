import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import BlobBackground from "../components/ui/BlobBackground";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 animated-bg">
      <BlobBackground />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
        className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-200">
              <span className="text-white font-black">S</span>
            </div>
            <span className="font-black text-xl text-gray-900 dark:text-white">SaveSangam</span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Sign in to your account</p>
        </div>

        <div className="glass p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" className="input-field pl-11" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="relative">
              <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" className="input-field pl-11" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link>
            </div>
            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
              className="btn-primary w-full py-3 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">Sign In <FiArrowRight size={16} /></span>
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">Sign up free</Link>
        </p>
      </motion.div>
    </div>
  );
}
