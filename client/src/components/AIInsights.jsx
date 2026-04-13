import { useEffect, useState } from "react";
import api from "../services/api";
import { FiCpu } from "react-icons/fi";

export default function AIInsights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/ai/insights")
      .then((res) => setInsights(res.data))
      .catch(() => setInsights([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!insights.length) return null;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <FiCpu size={14} className="text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">AI Insights</h3>
        <span className="ml-auto text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
          Powered by GPT
        </span>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <span className="text-xl flex-shrink-0">{insight.icon}</span>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{insight.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{insight.tip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
