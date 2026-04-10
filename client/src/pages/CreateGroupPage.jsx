import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    monthlyAmount: "",
    maxMembers: "",
    duration: "",
    startDate: "",
    payoutType: "random",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/groups", form);
      toast.success("Group created!");
      navigate(`/groups/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Bhishi Group</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name *</label>
            <input className="input-field" placeholder="e.g. Family Bhishi 2025" value={form.name} onChange={set("name")} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea className="input-field" rows={2} placeholder="Optional description" value={form.description} onChange={set("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Amount (₹) *</label>
              <input className="input-field" type="number" min="1" placeholder="5000" value={form.monthlyAmount} onChange={set("monthlyAmount")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Members *</label>
              <input className="input-field" type="number" min="2" placeholder="10" value={form.maxMembers} onChange={set("maxMembers")} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (months) *</label>
              <input className="input-field" type="number" min="1" placeholder="12" value={form.duration} onChange={set("duration")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input className="input-field" type="date" value={form.startDate} onChange={set("startDate")} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payout Order</label>
            <select className="input-field" value={form.payoutType} onChange={set("payoutType")}>
              <option value="random">Random (auto-shuffle)</option>
              <option value="manual">Manual (admin assigns)</option>
            </select>
          </div>

          {/* Preview */}
          {form.monthlyAmount && form.maxMembers && (
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 text-sm">
              <p className="font-medium text-primary-700 dark:text-primary-300">Pool Preview</p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Each month: ₹{form.monthlyAmount} × {form.maxMembers} members = <strong>₹{form.monthlyAmount * form.maxMembers}</strong> payout
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Spinner size="sm" /> : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
