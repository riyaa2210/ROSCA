import { useEffect, useState } from "react";
import api from "../services/api";
import Spinner from "../components/Spinner";
import { FiBell } from "react-icons/fi";

const typeIcons = {
  payment_reminder: "⏰",
  payout_announcement: "🏆",
  group_invite: "📨",
  general: "🔔",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/notifications").then((res) => setNotifications(res.data)).finally(() => setLoading(false));
    api.put("/notifications/read");
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FiBell size={24} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-16">
          <span className="text-5xl">🔕</span>
          <p className="mt-4 text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n._id} className={`card flex gap-4 ${!n.isRead ? "border-l-4 border-primary-500" : ""}`}>
              <span className="text-2xl">{typeIcons[n.type]}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{n.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
