import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import StatCard from "../components/StatCard";
import GroupCard from "../components/GroupCard";
import Spinner from "../components/Spinner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import AIInsights from "../components/AIInsights";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [groups, setGroups] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/users/dashboard"),
      api.get("/groups"),
      api.get("/users/transactions"),
    ]).then(([s, g, tx]) => {
      setStats(s.data);
      setGroups(g.data);
      setTransactions(tx.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  // Build chart data from transactions
  const chartData = transactions
    .filter((tx) => tx.status === "paid")
    .map((tx) => ({
      name: tx.group?.name?.slice(0, 8) || "Group",
      amount: tx.amount,
      type: tx.type,
    }));

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("dashboard")} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user?.name}</p>
        </div>
        <Link to="/groups/create" className="btn-primary">
          + {t("createGroup")}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title={t("totalContributed")} value={`₹${stats?.totalContributed || 0}`} icon="💸" color="primary" />
        <StatCard title={t("totalReceived")} value={`₹${stats?.totalReceived || 0}`} icon="🏆" color="green" />
        <StatCard title={t("pendingPayments")} value={stats?.pendingPayments || 0} icon="⏳" color="yellow" />
        <StatCard title={t("activeGroups")} value={groups.filter((g) => g.status === "active").length} icon="👥" color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("groups")}</h2>
            <Link to="/groups" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {groups.length === 0 ? (
            <div className="card text-center py-10">
              <span className="text-4xl">🏦</span>
              <p className="mt-3 text-gray-500">No groups yet.</p>
              <Link to="/groups/create" className="btn-primary mt-4 inline-block">Create your first group</Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {groups.slice(0, 4).map((g) => <GroupCard key={g._id} group={g} />)}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-6">
          {/* AI Insights */}
          <AIInsights />
          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `₹${v}`} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent transactions */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx._id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{tx.group?.name}</p>
                      <p className="text-xs text-gray-500">Month {tx.month} · {tx.type}</p>
                    </div>
                    <span className={`font-semibold ${tx.status === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                      {tx.status === "paid" ? "+" : ""}₹{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
