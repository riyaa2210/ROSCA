import { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fmt = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-bold text-gray-900 dark:text-white">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function TrendsChart({ trends, months, onMonthsChange }) {
  const [type, setType] = useState("bar");

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Contribution Trends</h3>
          <p className="text-xs text-gray-500 mt-0.5">Monthly contributions vs payouts received</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {["bar", "line"].map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  type === t ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm" : "text-gray-500"
                }`}>
                {t}
              </button>
            ))}
          </div>
          <select value={months} onChange={(e) => onMonthsChange(Number(e.target.value))}
            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {[3, 6, 12, 24].map((m) => <option key={m} value={m}>{m} months</option>)}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={trends} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
            tickFormatter={(v) => v >= 1000 ? `₹${v / 1000}k` : `₹${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
          {type === "bar" ? (
            <>
              <Bar dataKey="contribution" name="Contributed" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="payout"       name="Received"    fill="#10b981" radius={[4,4,0,0]} maxBarSize={32} />
            </>
          ) : (
            <>
              <Line dataKey="contribution" name="Contributed" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line dataKey="payout"       name="Received"    stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
