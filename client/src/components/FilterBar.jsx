import { FiChevronDown } from "react-icons/fi";

/**
 * Reusable filter + sort bar
 * filters: [{ key, label, options: [{value, label}] }]
 * values: { [key]: currentValue }
 * onChange: (key, value) => void
 */
export default function FilterBar({ filters = [], values = {}, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(({ key, label, options }) => (
        <div key={key} className="relative">
          <select
            value={values[key] || ""}
            onChange={(e) => onChange(key, e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">{label}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <FiChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      ))}
    </div>
  );
}
