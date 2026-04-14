import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const statusCls = { active: "bg-emerald-100 text-emerald-700", pending: "bg-amber-100 text-amber-700", completed: "bg-sky-100 text-sky-700" };

export default function GroupBreakdown({ breakdown }) {
  if (!breakdown?.length) return null;

  const chartData = breakdown.slice(0, 6).map((g) => ({
    name: g.groupName.length > 10 ? g.groupName.slice(0, 10) + "…" : g.groupName,
    contributed: g.contributed,
    received:    g.received,
  }));

  return (
    <div className="card">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">Per-Group Breakdown</h3>
      <p className="text-xs text-gray-500 mb-5">Contributions vs payouts per group</p>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip formatter={(v, n) => [fmt(v), n === "contributed" ? "Contributed" : "Received"]}
            contentStyle={{ fontSize: 11, borderRadius: 8 }} />
          <Bar dataKey="contributed" name="Contributed" fill="#6366f1" radius={[3,3,0,0]} maxBarSize={20} />
          <Bar dataKey="received"    name="Received"    fill="#10b981" radius={[3,3,0,0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        {breakdown.slice(0, 5).map((g) => (
          <div key={g.groupId} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{g.groupName}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusCls[g.status] || "bg-gray-100 text-gray-600"}`}>
                {g.status}
              </span>
            </div>
            <div className="text-right text-xs">
              <div className="text-indigo-600 font-semibold">{fmt(g.contributed)}</div>
              <div className="text-emerald-600">{fmt(g.received)} rcvd</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
