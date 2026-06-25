import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://backend-2xiu.onrender.com",
});

// Circuit Breaker State
let isBlocked = false;

// Request Interceptor
api.interceptors.request.use((config) => {
  if (isBlocked) {
    return Promise.reject(new Error("Server is overloaded, blocking requests."));
  }
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // 1. Agar 429 hai, toh 'isBlocked' ko true karein aur 30 seconds wait karein
    if (response?.status === 429) {
      if (!isBlocked) {
        isBlocked = true;
        console.error("CRITICAL: Rate limit hit. Blocking all requests for 30s...");
        setTimeout(() => { isBlocked = false; }, 30000); // 30 seconds ka break
      }
      return Promise.reject(error); // Retry mat karo, yahan se reject kar do
    }

    // 2. 401 (Unauthorized)
    if (response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;