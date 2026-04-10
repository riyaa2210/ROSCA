import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">💰</span>
          <h1 className="text-2xl font-bold mt-3 text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Join the Bhishi community</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Full Name", key: "name", type: "text", placeholder: "Rahul Sharma" },
            { label: "Email", key: "email", type: "email", placeholder: "you@example.com" },
            { label: "Phone", key: "phone", type: "tel", placeholder: "+91 9876543210" },
            { label: "Password", key: "password", type: "password", placeholder: "Min 6 characters" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
              <input
                type={type}
                className="input-field"
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key !== "phone"}
              />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <Spinner size="sm" /> : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
