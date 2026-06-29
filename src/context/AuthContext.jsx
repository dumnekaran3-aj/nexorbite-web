// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,          setUser]          = useState(null);
  const [collegeStatus, setCollegeStatus] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const isFetchingRef = useRef(false);

  // ── Fetch college status separately — ProfileView & AdminPanel use karta hai ──
  const refreshCollegeStatus = useCallback(async () => {
    try {
      const res = await api.get("/api/createcollege/handler");
      setCollegeStatus(res.data.collegeStatus || { isJoined: false });
    } catch {
      setCollegeStatus({ isJoined: false });
    }
  }, []);

  // ── Load user + college status on mount ──────────────────────────────────────
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [profileRes, collegeRes] = await Promise.allSettled([
        api.get("/api/profile/me"),
        api.get("/api/createcollege/handler"),
      ]);

      if (profileRes.status === "fulfilled") {
        const profile = profileRes.value.data.profile;
        setUser(profile);
        if (profile?._id) {
          connectSocket(
            String(profile._id),
            profile.collegeId ? String(profile.collegeId) : null
          );
        }
      } else {
        throw new Error("Auth failed");
      }

      if (collegeRes.status === "fulfilled" && collegeRes.value.data?.success) {
        setCollegeStatus(collegeRes.value.data.collegeStatus);
      } else {
        setCollegeStatus({ isJoined: false });
      }
    } catch {
      localStorage.removeItem("token");
      setUser(null);
      setCollegeStatus(null);
      disconnectSocket();
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setCollegeStatus(null);
    disconnectSocket();
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loading,
      collegeStatus,
      setCollegeStatus,
      refreshUser:           loadUser,          // profile refresh
      refreshCollegeStatus,                     // FIX: ProfileView yeh use karta tha, missing tha
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};