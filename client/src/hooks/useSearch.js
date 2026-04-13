import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useDebounce } from "./useDebounce";

/**
 * Generic search hook — debounces input, calls API, returns results + state
 * @param {string} endpoint  - API endpoint e.g. "/groups"
 * @param {object} params    - extra query params (status, type, sortBy, etc.)
 * @param {number} debounceMs
 */
export function useSearch(endpoint, params = {}, debounceMs = 400) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const debouncedQuery = useDebounce(query, debounceMs);

  const fetch = useCallback(async (overrideParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(endpoint, {
        params: { search: debouncedQuery, ...params, ...overrideParams },
      });
      // Handle both array responses and paginated {items, total, ...} responses
      if (Array.isArray(data)) {
        setResults(data);
        setPagination(null);
      } else {
        const key = Object.keys(data).find((k) => Array.isArray(data[k]));
        setResults(key ? data[key] : []);
        const { total, page, limit, totalPages, hasNext, hasPrev } = data;
        setPagination({ total, page, limit, totalPages, hasNext, hasPrev });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }, [endpoint, debouncedQuery, JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { query, setQuery, results, loading, error, pagination, refetch: fetch };
}
