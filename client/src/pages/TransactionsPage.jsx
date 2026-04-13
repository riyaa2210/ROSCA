import { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import Spinner from "../components/Spinner";
import { useSearch } from "../hooks/useSearch";
import { FiArrowUpRight, FiArrowDownLeft } from "react-icons/fi";

const FILTER_CONFIG = [
  {
    key: "status",
    label: "All Status",
    options: [
      { value: "paid",    label: "Paid" },
      { value: "pending", label: "Pending" },
      { value: "failed",  label: "Failed" },
    ],
  },
  {
    key: "type",
    label: "All Types",
    options: [
      { value: "contribution", label: "Contribution" },
      { value: "payout",       label: "Payout" },
    ],
  },
  {
    key: "sort",
    label: "Sort by",
    options: [
      { value: "createdAt|desc", label: "Newest first" },
      { value: "createdAt|asc",  label: "Oldest first" },
      { value: "amount|desc",    label: "Highest amount" },
      { value: "amount|asc",     label: "Lowest amount" },
    ],
  },
];

const statusStyle = {
  paid:    "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed:  "bg-red-100 text-red-700",
};

export default function TransactionsPage() {
  const [filters, setFilters] = useState({
    status: "", type: "", sort: "createdAt|desc",
    dateFrom: "", dateTo: "",
  });

  const [sortBy, order] = (filters.sort || "createdAt|desc").split("|");

  const { query, setQuery, results: transactions, loading, pagination } = useSearch(
    "/users/transactions",
    { status: filters.status, type: filters.type, sortBy, order, dateFrom: filters.dateFrom, dateTo: filters.dateTo }
  );

  const handleFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Transaction History
      </h1>

      {/* Search + Filters */}
      <div className="card mb-6 space-y-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by status or type..."
        />
        <div className="flex flex-wrap gap-3 items-center">
          <FilterBar
            filters={FILTER_CONFIG}
            values={filters}
            onChange={handleFilter}
          />
          {/* Date range */}
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilter("dateFrom", e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilter("dateTo", e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {(filters.dateFrom || filters.dateTo) && (
              <button
                onClick={() => { handleFilter("dateFrom", ""); handleFilter("dateTo", ""); }}
                className="text-xs text-indigo-600 hover:underline"
              >
                Clear dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results count */}
      {pagination && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {pagination.total} transaction{pagination.total !== 1 ? "s" : ""}
        </p>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !transactions || transactions.length === 0 ? (
        <div className="card text-center py-16">
          <span className="text-5xl">📭</span>
          <p className="mt-4 text-gray-500">No transactions found.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-700 p-0 overflow-hidden">
          {transactions.map((tx) => (
            <div key={tx._id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              {/* Icon */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                tx.type === "payout"
                  ? "bg-green-100 text-green-600"
                  : "bg-indigo-100 text-indigo-600"
              }`}>
                {tx.type === "payout"
                  ? <FiArrowDownLeft size={16} />
                  : <FiArrowUpRight size={16} />}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {tx.group?.name || "Unknown Group"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tx.type === "contribution" ? "Contribution" : "Payout"} · Month {tx.month} ·{" "}
                  {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              {/* Amount + status */}
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${tx.type === "payout" ? "text-green-600" : "text-gray-900 dark:text-white"}`}>
                  {tx.type === "payout" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                </p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[tx.status] || "bg-gray-100 text-gray-600"}`}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
