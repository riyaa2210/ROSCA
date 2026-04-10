import { useEffect, useState } from "react";
import api from "../services/api";
import Spinner from "../components/Spinner";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("users");

  useEffect(() => {
    Promise.all([api.get("/users/all"), api.get("/groups/all")])
      .then(([u, g]) => { setUsers(u.data); setGroups(g.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Panel</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: users.length },
          { label: "Total Groups", value: groups.length },
          { label: "Active Groups", value: groups.filter((g) => g.status === "active").length },
          { label: "Completed", value: groups.filter((g) => g.status === "completed").length },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-bold text-primary-600">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        {["users", "groups"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${tab === t ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Phone</th>
                <th className="pb-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{u.name}</td>
                  <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                  <td className="py-3 pr-4 text-gray-500">{u.phone || "—"}</td>
                  <td className="py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "groups" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Admin</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Members</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {groups.map((g) => (
                <tr key={g._id}>
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{g.name}</td>
                  <td className="py-3 pr-4 text-gray-500">{g.admin?.name}</td>
                  <td className="py-3 pr-4 text-gray-500">₹{g.monthlyAmount}</td>
                  <td className="py-3 pr-4 text-gray-500">{g.members?.length}/{g.maxMembers}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      g.status === "active" ? "bg-green-100 text-green-700" :
                      g.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>{g.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
