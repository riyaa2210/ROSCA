import axios from "axios";

/**
 * Since frontend and backend are on the SAME Render service (same origin),
 * relative "/api" always works — no VITE_API_URL needed.
 *
 * Dev: Vite proxy forwards /api → localhost:5000
 * Prod: Express serves React AND handles /api/* on the same port
 */
const api = axios.create({
  baseURL: "/api",
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
