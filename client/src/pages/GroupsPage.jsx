import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import GroupCard from "../components/GroupCard";
import Spinner from "../components/Spinner";
import { useTranslation } from "react-i18next";

export default function GroupsPage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/groups").then((res) => setGroups(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? groups : groups.filter((g) => g.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("groups")}</h1>
        <Link to="/groups/create" className="btn-primary">+ {t("createGroup")}</Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "pending", "active", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? "bg-primary-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <span className="text-5xl">🏦</span>
          <p className="mt-4 text-gray-500 dark:text-gray-400">No groups found.</p>
          <Link to="/groups/create" className="btn-primary mt-4 inline-block">Create a Group</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => <GroupCard key={g._id} group={g} />)}
        </div>
      )}
    </div>
  );
}
