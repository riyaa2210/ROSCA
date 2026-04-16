import axios from "axios";

/**
 * API base URL:
 *  - Dev:  empty VITE_API_URL → Vite proxy forwards /api → localhost:5000
 *  - Prod (same service): VITE_API_URL not set → relative /api works
 *  - Prod (separate static site): VITE_API_URL = https://your-backend.onrender.com
 */
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
