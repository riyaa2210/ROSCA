import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Reset email sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Forgot Password</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Enter your email to receive a reset link.</p>
        {sent ? (
          <div className="text-center py-4">
            <span className="text-4xl">📧</span>
            <p className="mt-3 text-gray-700 dark:text-gray-300">Check your inbox for the reset link.</p>
            <Link to="/login" className="mt-4 inline-block text-primary-600 hover:underline">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Spinner size="sm" /> : "Send Reset Link"}
            </button>
            <Link to="/login" className="block text-center text-sm text-gray-500 hover:underline">Back to Login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
