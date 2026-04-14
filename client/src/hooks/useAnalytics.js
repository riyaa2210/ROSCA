import { useState, useEffect } from "react";
import api from "../services/api";

export function useAnalytics() {
  const [overview,  setOverview]  = useState(null);
  const [trends,    setTrends]    = useState([]);
  const [behaviour, setBehaviour] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [months,    setMonths]    = useState(6);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/analytics/overview"),
      api.get(`/analytics/trends?months=${months}`),
      api.get("/analytics/payment-behaviour"),
      api.get("/analytics/group-breakdown"),
    ])
      .then(([o, t, b, g]) => {
        setOverview(o.data);
        setTrends(t.data);
        setBehaviour(b.data);
        setBreakdown(g.data);
      })
      .finally(() => setLoading(false));
  }, [months]);

  return { overview, trends, behaviour, breakdown, loading, months, setMonths };
}
