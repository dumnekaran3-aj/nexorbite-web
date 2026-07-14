// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { setupPushNotifications, unsubscribePush, setupSWMessageHandler } from "../lib/pushManager";
import { getMyCommunities } from "../lib/community.api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,          setUser]          = useState(null);
  const [collegeStatus, setCollegeStatus] = useState(null);
  // MULTI-COMMUNITY (Day 1): full list — 1 private + N public communities.
  // Kept SEPARATE from collegeStatus on purpose — collegeStatus stays wired
  // to the old private-only /handler endpoint so every existing component
  // that reads `collegeStatus` keeps working unchanged.
  const [communities,   setCommunities]   = useState({ privateCommunity: null, publicCommunities: [] });
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

  // MULTI-COMMUNITY (Day 1): refresh the full community list.
  // getMyCommunities() is already defensive (never throws), so no try/catch
  // needed here — it always resolves to a safe { privateCommunity, publicCommunities } shape.
  const refreshCommunities = useCallback(async () => {
    const data = await getMyCommunities();
    setCommunities(data);
  }, []);

  // Convenience helper: "am I a member (private OR public) of this collegeId?"
  // Components should use this instead of comparing `user.collegeId` directly,
  // since user.collegeId only reflects PRIVATE membership after the Day 1 fix.
  const isMemberOfCommunity = useCallback(
    (collegeId) => {
      if (!collegeId) return false;
      const target = String(collegeId);
      if (communities.privateCommunity && String(communities.privateCommunity.collegeId) === target) {
        return true;
      }
      return communities.publicCommunities.some((c) => String(c.collegeId) === target);
    },
    [communities]
  );

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

      // MULTI-COMMUNITY (Day 1): fetch the full community list alongside the
      // existing profile/collegeStatus calls. Fire-and-forget with its own
      // safety net so a failure here can never break login.
      refreshCommunities();

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
      setCommunities({ privateCommunity: null, publicCommunities: [] });
      disconnectSocket();
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [refreshCommunities]);

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
    setCommunities({ privateCommunity: null, publicCommunities: [] });
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
      communities,
      refreshCommunities,
      isMemberOfCommunity,
      refreshUser:          loadUser,
      refreshCollegeStatus,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};