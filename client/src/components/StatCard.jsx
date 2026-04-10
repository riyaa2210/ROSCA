export default function StatCard({ title, value, icon, color = "primary" }) {
  const colors = {
    primary: "bg-primary-50 dark:bg-primary-900/20 text-primary-600",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600",
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl text-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
