import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GroupCard from "../components/GroupCard";
import Spinner from "../components/Spinner";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import { useSearch } from "../hooks/useSearch";

const STATUS_FILTERS = [
  { value: "pending",   label: "Pending" },
  { value: "active",    label: "Active" },
  { value: "completed", label: "Completed" },
];

const SORT_OPTIONS = [
  { value: "createdAt|desc", label: "Newest first" },
  { value: "createdAt|asc",  label: "Oldest first" },
  { value: "amount|desc",    label: "Highest amount" },
  { value: "amount|asc",     label: "Lowest amount" },
  { value: "name|asc",       label: "Name A–Z" },
];

export default function GroupsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ status: "", sort: "createdAt|desc" });

  const [sortBy, order] = (filters.sort || "createdAt|desc").split("|");

  const { query, setQuery, results: groups, loading, pagination } = useSearch(
    "/groups",
    { status: filters.status, sortBy, order }
  );

  const handleFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const filterConfig = [
    {
      key: "status",
      label: "All Status",
      options: STATUS_FILTERS,
    },
    {
      key: "sort",
      label: "Sort by",
      options: SORT_OPTIONS,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("groups")}</h1>
        <Link to="/groups/create" className="btn-primary">+ {t("createGroup")}</Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search groups by name..."
          className="flex-1"
        />
        <FilterBar filters={filterConfig} values={filters} onChange={handleFilter} />
      </div>

      {/* Results count */}
      {pagination && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {pagination.total} group{pagination.total !== 1 ? "s" : ""} found
          {query && ` for "${query}"`}
        </p>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !groups || groups.length === 0 ? (
        <div className="card text-center py-16">
          <span className="text-5xl">🔍</span>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {query ? `No groups found for "${query}"` : "No groups yet."}
          </p>
          {!query && (
            <Link to="/groups/create" className="btn-primary mt-4 inline-block">
              Create a Group
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => <GroupCard key={g._id} group={g} />)}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {}} // extend with page state if needed
              className={`w-8 h-8 rounded-lg text-sm font-medium ${
                p === pagination.page
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
