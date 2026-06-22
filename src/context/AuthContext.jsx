import { createContext, useState, useEffect } from "react";
import api from "../lib/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile status check: kya user ne full name setup kiya hai?
  const isProfileComplete = (userData) => {
    return userData && userData.fullName && userData.fullName.length > 0;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.get("api/profile/me")
        .then((res) => {
            setUser(res.data.profile);
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, isProfileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};