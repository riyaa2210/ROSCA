import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";
import PaymentModal from "../components/PaymentModal";
import { FiCopy, FiMail, FiPlay, FiDollarSign, FiBell } from "react-icons/fi";

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [tab, setTab] = useState("overview");

  const fetchGroup = () =>
    Promise.all([
      api.get(`/groups/${id}`),
      api.get(`/groups/${id}/payment-status`),
    ]).then(([g, ps]) => {
      setGroup(g.data);
      setPaymentStatus(ps.data);
    });

  useEffect(() => {
    fetchGroup().finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!group) return <div className="text-center py-20 text-gray-500">Group not found.</div>;

  const isAdmin = group.admin._id === user._id;
  const activeMembers = group.members.filter((m) => m.status === "active");
  const myPayment = paymentStatus.find((tx) => tx.user?._id === user._id);
  const inviteLink = `${window.location.origin}/join/${group.inviteCode}`;

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      await api.post(`/groups/${id}/invite`, { email: inviteEmail });
      toast.success("Invitation sent!");
      setInviteEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invite");
    }
  };

  const handleStart = async () => {
    try {
      await api.post(`/groups/${id}/start`);
      toast.success("Group started!");
      fetchGroup();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start group");
    }
  };

  const handlePayout = async () => {
    try {
      const { data } = await api.post(`/groups/${id}/payout`);
      toast.success(`Payout of ₹${data.payoutAmount} processed for ${data.recipient.name}`);
      fetchGroup();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payout failed");
    }
  };

  const handleReminders = async () => {
    try {
      const { data } = await api.post(`/groups/${id}/reminders`);
      toast.success(data.message);
    } catch (err) {
      toast.error("Failed to send reminders");
    }
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      await api.post(`/groups/${id}/leave`);
      toast.success("Left group");
      navigate("/groups");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
          {group.description && <p className="text-gray-500 dark:text-gray-400 mt-1">{group.description}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            group.status === "active" ? "bg-green-100 text-green-700" :
            group.status === "pending" ? "bg-yellow-100 text-yellow-700" :
            "bg-gray-100 text-gray-700"
          }`}>{group.status}</span>
          {!isAdmin && (
            <button onClick={handleLeave} className="text-sm text-red-500 hover:underline">Leave</button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Monthly", value: `₹${group.monthlyAmount}` },
          { label: "Members", value: `${activeMembers.length}/${group.maxMembers}` },
          { label: "Duration", value: `${group.duration} months` },
          { label: "Pool/Month", value: `₹${group.monthlyAmount * activeMembers.length}` },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center py-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Admin Actions</h3>
          <div className="flex flex-wrap gap-3">
            {group.status === "pending" && (
              <button onClick={handleStart} className="btn-primary flex items-center gap-2">
                <FiPlay size={14} /> Start Group
              </button>
            )}
            {group.status === "active" && (
              <>
                <button onClick={handlePayout} className="btn-primary flex items-center gap-2">
                  <FiDollarSign size={14} /> Process Payout (Month {group.currentMonth})
                </button>
                <button onClick={handleReminders} className="btn-secondary flex items-center gap-2">
                  <FiBell size={14} /> Send Reminders
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {["overview", "members", "payments", "invite"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="space-y-4">
          {group.status === "active" && (
            <div className="card">
              <h3 className="font-semibold mb-3">Payout Schedule</h3>
              <div className="space-y-2">
                {group.payoutOrder.map((u, i) => (
                  <div key={u._id} className={`flex items-center gap-3 p-2 rounded-lg ${i + 1 === group.currentMonth ? "bg-primary-50 dark:bg-primary-900/20" : ""}`}>
                    <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <img src={u.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff`} className="w-7 h-7 rounded-full" alt={u.name} />
                    <span className="text-sm font-medium">{u.name}</span>
                    {i + 1 < group.currentMonth && <span className="ml-auto text-xs text-green-600 font-medium">✓ Received</span>}
                    {i + 1 === group.currentMonth && <span className="ml-auto text-xs text-primary-600 font-medium">← Current</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My payment status */}
          {group.status === "active" && (
            <div className="card">
              <h3 className="font-semibold mb-3">My Payment — Month {group.currentMonth}</h3>
              {myPayment?.status === "paid" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-xl">✅</span>
                  <span className="font-medium">Paid ₹{myPayment.amount}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-yellow-600 font-medium">⏳ Payment pending — ₹{group.monthlyAmount}</span>
                  <button onClick={() => setShowPayModal(true)} className="btn-primary">Pay Now</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "members" && (
        <div className="card">
          <h3 className="font-semibold mb-4">Members ({activeMembers.length})</h3>
          <div className="space-y-3">
            {activeMembers.map(({ user: u }) => (
              <div key={u._id} className="flex items-center gap-3">
                <img src={u.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff`} className="w-10 h-10 rounded-full" alt={u.name} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                {group.admin._id === u._id && (
                  <span className="ml-auto text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Admin</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="card">
          <h3 className="font-semibold mb-4">Payment Status — Month {group.currentMonth}</h3>
          <div className="space-y-3">
            {paymentStatus.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={tx.user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(tx.user?.name || "U")}&background=6366f1&color=fff`} className="w-8 h-8 rounded-full" alt={tx.user?.name} />
                  <span className="text-sm font-medium">{tx.user?.name}</span>
                </div>
                <span className={`text-sm font-semibold ${tx.status === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                  {tx.status === "paid" ? "✅ Paid" : "⏳ Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "invite" && isAdmin && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Invite Members</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invite Link</label>
            <div className="flex gap-2">
              <input className="input-field" readOnly value={inviteLink} />
              <button
                onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Copied!"); }}
                className="btn-secondary flex items-center gap-1"
              >
                <FiCopy size={14} /> Copy
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invite by Email</label>
            <div className="flex gap-2">
              <input
                className="input-field"
                type="email"
                placeholder="friend@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <button onClick={handleInvite} className="btn-primary flex items-center gap-1">
                <FiMail size={14} /> Send
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <PaymentModal
          group={group}
          month={group.currentMonth}
          onClose={() => setShowPayModal(false)}
          onSuccess={fetchGroup}
        />
      )}
    </div>
  );
}
