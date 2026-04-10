import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";
import { FiCamera } from "react-icons/fi";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", preferredLanguage: user?.preferredLanguage || "en" });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put("/users/profile", form);
      updateUser(data);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("profilePic", file);
    try {
      const { data } = await api.post("/users/profile/picture", fd);
      updateUser({ ...user, profilePic: data.profilePic });
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Profile</h1>
      <div className="card">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <img
              src={user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=6366f1&color=fff&size=80`}
              alt={user?.name}
              className="w-20 h-20 rounded-full object-cover"
            />
            <button
              onClick={() => fileRef.current.click()}
              className="absolute bottom-0 right-0 bg-primary-600 text-white p-1.5 rounded-full hover:bg-primary-700"
            >
              {uploading ? <Spinner size="sm" /> : <FiCamera size={12} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicUpload} />
          </div>
          <div>
            <p className="font-semibold text-lg text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input className="input-field" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
            <select className="input-field" value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}>
              <option value="en">English</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <Spinner size="sm" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
