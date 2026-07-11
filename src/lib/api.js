import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://backend-2xiu.onrender.com",
});

let rateLimitedUntil = 0;

// FIX: token khud missing ho to hi turant hard-logout karo.
// Agar token maujood hai lekin ek secondary/parallel API call 401 de rahi hai
// (jaise CommunityView ke 5 parallel calls me se ek), to turant logout mat karo —
// warna genuine session ko bhi false-positive pe destroy kar dete the.
let logoutInProgress = false;

api.interceptors.request.use((config) => {

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
    const { response, config } = error;

    if (response?.status === 429) {

      const retryAfter = parseInt(response.headers?.["retry-after"] || "15", 10);
      rateLimitedUntil = Date.now() + retryAfter * 1000;

      console.warn(`Rate limited. Blocking for ${retryAfter}s.`);

      return Promise.reject(error);
    }

    if (response?.status === 401 && window.location.pathname !== "/login") {
      // FIX: agar localStorage me token hi nahi hai (already logged out state),
      // to dobara redirect chain trigger karne ki zaroorat nahi.
      const token = localStorage.getItem("token");
      if (!token) return Promise.reject(error);

      // FIX: sirf primary auth-verifying endpoint (/api/profile/me) ka 401
      // hi guaranteed session-invalid maana jayega. Baaki koi bhi secondary
      // endpoint (jaise community/friends/requests) ka 401 sirf ek route-level
      // issue ho sakta hai — poora app logout karne ki wajah nahi.
      const isPrimaryAuthCheck = config?.url?.includes("/api/profile/me");

      if (isPrimaryAuthCheck && !logoutInProgress) {
        logoutInProgress = true;
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else if (!isPrimaryAuthCheck) {
        console.warn(`[api] 401 on secondary endpoint ${config?.url} — ignoring, session kept alive.`);
      }
    }

    return Promise.reject(error);
  }

);

export default api;