import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import PageTransition from "../components/ui/PageTransition";
import { SkeletonCard, SkeletonList } from "../components/ui/Skeleton";
import AIInsights from "../components/AIInsights";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { FiArrowUpRight, FiArrowDownLeft, FiPlus, FiTrendingUp } from "react-icons/fi";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: [0.22,1,0.36,1] } }),
};

const STAT_CARDS = (stats, groups) => [
  {
    label: "Total Contributed",
    value: stats?.totalContributed || 0,
    prefix: "₹",
    icon: "💸",
    change: "+12%",
    positive: true,
    gradient: "from-brand-500 to-purple-600",
    bg: "from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/10",
  },
  {
    label: "Total Received",
    value: stats?.totalReceived || 0,
    prefix: "₹",
    icon: "🏆",
    change: "+8%",
    positive: true,
    gradient: "from-emerald-500 to-teal-500",
    bg: "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10",
  },
  {
    label: "Pending Payments",
    value: stats?.pendingPayments || 0,
    prefix: "",
    icon: "⏳",
    change: stats?.pendingPayments > 0 ? "Action needed" : "All clear",
    positive: stats?.pendingPayments === 0,
    gradient: "from-amber-500 to-orange-500",
    bg: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10",
  },
  {
    label: "Active Groups",
    value: groups?.filter((g) => g.status === "active").length || 0,
    prefix: "",
    icon: "👥",
    change: `${groups?.length || 0} total`,
    positive: true,
    gradient: "from-saffron-500 to-pink-500",
    bg: "from-saffron-50 to-pink-50 dark:from-saffron-900/20 dark:to-pink-900/10",
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-4 py-3 text-xs shadow-xl">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-bold">₹{p.value?.toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats,        setStats]        = useState(null);
  const [groups,       setGroups]       = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [trends,       setTrends]       = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/users/dashboard"),
      api.get("/groups"),
      api.get("/users/transactions"),
      api.get("/analytics/trends?months=6"),
    ]).then(([s, g, tx, tr]) => {
      setStats(s.data);
      setGroups(Array.isArray(g.data) ? g.data : g.data?.groups || []);
      setTransactions(Array.isArray(tx.data) ? tx.data.slice(0, 6) : tx.data?.transactions?.slice(0, 6) || []);
      setTrends(tr.data);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = STAT_CARDS(stats, groups);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <motion.h1 initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-black text-gray-900 dark:text-white">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
              <span className="gradient-text">{user?.name?.split(" ")[0]}</span> 👋
            </motion.h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Here's what's happening with your savings today.
            </p>
          </div>
          <Link to="/groups/create" className="btn-primary hidden sm:inline-flex">
            <FiPlus size={16} /> New Group
          </Link>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <motion.div key={card.label} custom={i} variants={cardVariants} initial="hidden" animate="show"
                whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.12)" }}
                className={`relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br ${card.bg} border border-white/60 dark:border-white/5 cursor-default`}>
                {/* Decorative circle */}
                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10`} />
                <div className="text-2xl mb-3">{card.icon}</div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  <AnimatedCounter value={card.value} prefix={card.prefix} />
                </div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</div>
                <div className={`text-xs font-semibold mt-2 flex items-center gap-1 ${card.positive ? "text-emerald-600" : "text-amber-600"}`}>
                  <FiTrendingUp size={11} />
                  {card.change}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chart — 2/3 width */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Activity Overview</h3>
                <p className="text-xs text-gray-500 mt-0.5">Last 6 months</p>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-brand-600"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" />Contributed</span>
                <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Received</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trends} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gContrib" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPayout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="contribution" name="Contributed" stroke="#6366f1" strokeWidth={2.5} fill="url(#gContrib)" dot={false} activeDot={{ r: 5, fill: "#6366f1" }} />
                <Area type="monotone" dataKey="payout"       name="Received"    stroke="#10b981" strokeWidth={2.5} fill="url(#gPayout)"  dot={false} activeDot={{ r: 5, fill: "#10b981" }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* AI Insights */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <AIInsights />
          </motion.div>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent transactions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
              <Link to="/transactions" className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
            </div>
            {loading ? <SkeletonList rows={4} /> : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <span className="text-4xl block mb-2">📭</span>
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {transactions.map((tx, i) => (
                  <motion.div key={tx._id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileHover={{ backgroundColor: "rgba(99,102,241,0.04)" }}
                    className="flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors cursor-default">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      tx.type === "payout" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-brand-100 dark:bg-brand-900/30 text-brand-600"
                    }`}>
                      {tx.type === "payout" ? <FiArrowDownLeft size={15} /> : <FiArrowUpRight size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{tx.group?.name || "—"}</p>
                      <p className="text-xs text-gray-400">Month {tx.month} · {tx.type}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === "payout" ? "text-emerald-600" : "text-gray-900 dark:text-white"}`}>
                        {tx.type === "payout" ? "+" : "-"}₹{tx.amount?.toLocaleString("en-IN")}
                      </p>
                      <span className={tx.status === "paid" ? "chip-paid" : tx.status === "pending" ? "chip-pending" : "chip-failed"}>
                        {tx.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Active groups */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">Active Groups</h3>
              <Link to="/groups" className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
            </div>
            {loading ? <SkeletonList rows={3} /> : groups.filter((g) => g.status === "active").length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <span className="text-4xl block mb-2">🏦</span>
                <p className="text-sm">No active groups</p>
                <Link to="/groups/create" className="btn-primary mt-3 text-xs px-4 py-2 inline-flex">Create one</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.filter((g) => g.status === "active").slice(0, 3).map((g, i) => {
                  const activeM = g.members?.filter((m) => m.status === "active").length || 0;
                  const pct = g.duration > 0 ? (g.currentMonth / g.duration) : 0;
                  return (
                    <motion.div key={g._id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 * i }}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer">
                      <div className="relative flex-shrink-0">
                        <svg width="44" height="44" className="progress-ring">
                          <circle cx="22" cy="22" r="18" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                          <circle cx="22" cy="22" r="18" fill="none" stroke="#6366f1" strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 18 * pct} ${2 * Math.PI * 18}`} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-brand-600">
                          {g.currentMonth}/{g.duration}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{g.name}</p>
                        <p className="text-xs text-gray-400">₹{g.monthlyAmount?.toLocaleString("en-IN")}/mo · {activeM} members</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand-600">₹{(g.monthlyAmount * activeM)?.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-gray-400">pool</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
