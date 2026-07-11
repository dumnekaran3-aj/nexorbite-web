import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://backend-2xiu.onrender.com",
});

let rateLimitedUntil = 0;

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
    const { response } = error;


    if (response?.status === 429) {
   
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