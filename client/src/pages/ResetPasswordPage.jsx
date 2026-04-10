import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      toast.success("Password reset! Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Reset Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            className="input-field"
            placeholder="New password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <Spinner size="sm" /> : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
