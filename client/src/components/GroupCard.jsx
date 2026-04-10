import { Link } from "react-router-dom";
import { FiUsers, FiCalendar, FiDollarSign } from "react-icons/fi";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function GroupCard({ group }) {
  const activeMembers = group.members?.filter((m) => m.status === "active").length || 0;

  return (
    <Link to={`/groups/${group._id}`} className="card hover:shadow-md transition-shadow block">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{group.name}</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[group.status]}`}>
          {group.status}
        </span>
      </div>
      {group.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{group.description}</p>
      )}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <FiDollarSign size={14} />
          <span>₹{group.monthlyAmount}/mo</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <FiUsers size={14} />
          <span>{activeMembers}/{group.maxMembers}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <FiCalendar size={14} />
          <span>{group.duration} months</span>
        </div>
      </div>
      {group.status === "active" && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Month {group.currentMonth} of {group.duration}</span>
            <span>Pool: ₹{group.monthlyAmount * activeMembers}</span>
          </div>
          <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div
              className="h-1.5 bg-primary-500 rounded-full"
              style={{ width: `${(group.currentMonth / group.duration) * 100}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
