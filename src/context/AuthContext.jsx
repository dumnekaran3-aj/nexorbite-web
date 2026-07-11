// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { setupPushNotifications, unsubscribePush, setupSWMessageHandler } from "../lib/pushManager";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,          setUser]          = useState(null);
  const [collegeStatus, setCollegeStatus] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const isFetchingRef = useRef(false);

  const refreshCollegeStatus = useCallback(async () => {
    try {
      const res = await api.get("/api/createcollege/handler");
      setCollegeStatus(res.data.collegeStatus || { isJoined: false });
    } catch {
      setCollegeStatus({ isJoined: false });
    }
  }, []);

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
          connectSocket(String(profile._id), profile.collegeId ? String(profile.collegeId) : null);

          // FIX: Push notifications setup — login hone ke baad silently setup karo
          // User ko permission prompt dikhega pehli baar
          setupPushNotifications().catch((e) =>
            console.warn("[PUSH] Setup silently failed:", e.message)
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

  // Service Worker navigate handler
  useEffect(() => {
    // navigate nahi hai yahan — SW message handler globally set karo
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (e) => {
        if (e.data?.type === "NAVIGATE" && e.data.url) {
          window.location.href = e.data.url;
        }
      });
    }
  }, []);

  const logout = async () => {
    await unsubscribePush().catch(() => {}); // Push unsubscribe
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
      refreshUser:          loadUser,
      refreshCollegeStatus,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};