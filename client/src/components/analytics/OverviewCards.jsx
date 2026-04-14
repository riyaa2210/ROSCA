const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function OverviewCards({ overview: o }) {
  if (!o) return null;

  const cards = [
    { label: "Total Contributed", value: fmt(o.totalContributed), sub: `${o.contributionCount} payments`,  icon: "💸", bg: "from-indigo-500 to-indigo-600" },
    { label: "Total Received",    value: fmt(o.totalReceived),    sub: `${o.payoutCount} payouts`,          icon: "🏆", bg: "from-emerald-500 to-emerald-600" },
    { label: "Net Savings",       value: fmt(o.netSavings),       sub: o.netSavings >= 0 ? "Positive" : "More contributed", icon: o.netSavings >= 0 ? "📈" : "📉", bg: o.netSavings >= 0 ? "from-teal-500 to-teal-600" : "from-rose-500 to-rose-600" },
    { label: "Monthly Due",       value: fmt(o.monthlyCommitment),sub: `${o.activeGroups} active group${o.activeGroups !== 1 ? "s" : ""}`, icon: "📅", bg: "from-violet-500 to-violet-600" },
    { label: "Pending",           value: o.pendingPayments,       sub: "Awaiting payment",                 icon: "⏳", bg: "from-amber-500 to-amber-600" },
    { label: "Completed Groups",  value: o.completedGroups,       sub: `of ${o.totalGroups} total`,        icon: "✅", bg: "from-sky-500 to-sky-600" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      {cards.map(({ label, value, sub, icon, bg }) => (
        <div key={label} className={`bg-gradient-to-br ${bg} rounded-2xl p-4 text-white`}>
          <div className="text-2xl mb-2">{icon}</div>
          <div className="text-xl font-bold leading-tight">{value}</div>
          <div className="text-xs font-medium opacity-90 mt-0.5">{label}</div>
          <div className="text-xs opacity-70 mt-0.5">{sub}</div>
        </div>
      ))}
    </div>
  );
}
