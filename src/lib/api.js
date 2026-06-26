import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://backend-2xiu.onrender.com",
});

// FIX: Circuit breaker hataya — isBlocked = true hone pe SAARI APIs block ho jaati
// thi even after 429 resolve ho jata. Yeh main reason tha ki community page pe
// koi bhi request nahi jaati thi. Simple retry-after logic use karo instead.
let rateLimitedUntil = 0;

api.interceptors.request.use((config) => {
  // Sirf tabhi block karo jab actually rate limited ho
  if (Date.now() < rateLimitedUntil) {
    const waitSec = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
    return Promise.reject(new Error(`Rate limited. Wait ${waitSec}s.`));
  }
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (response?.status === 429) {
      // Retry-After header se actual wait time lo, fallback 15s
      const retryAfter = parseInt(response.headers?.["retry-after"] || "15", 10);
      rateLimitedUntil = Date.now() + retryAfter * 1000;
      console.warn(`Rate limited. Blocking for ${retryAfter}s.`);
      return Promise.reject(error);
    }

    if (response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;