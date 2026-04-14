import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const risk = (p) => {
  if (p <= 10) return { text: "text-emerald-600", bg: "bg-emerald-100", label: "Excellent" };
  if (p <= 30) return { text: "text-amber-600",   bg: "bg-amber-100",   label: "Good" };
  if (p <= 60) return { text: "text-orange-600",  bg: "bg-orange-100",  label: "Fair" };
  return         { text: "text-red-600",    bg: "bg-red-100",    label: "Needs Attention" };
};

export default function PaymentBehaviour({ behaviour: b }) {
  if (!b) return null;
  const r = risk(b.lateProbability);

  return (
    <div className="card">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">Payment Behaviour</h3>
      <p className="text-xs text-gray-500 mb-5">Your payment reliability score</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { val: `${b.onTimeRate}%`,      label: "On-time rate",    color: "text-emerald-600" },
          { val: `${b.lateProbability}%`, label: "Late probability", color: r.text },
          { val: b.streak,                label: "Current streak",   color: "text-indigo-600" },
        ].map(({ val, label, color }) => (
          <div key={label} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className={`text-2xl font-bold ${color}`}>{val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${r.bg} ${r.text} mb-4`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Score: {r.label}
      </div>

      {b.pieData?.length > 0 && (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={b.pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
              {b.pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [v, n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
