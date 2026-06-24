import { createContext, useState, useEffect, useCallback } from "react";
import api from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [collegeStatus, setCollegeStatus] = useState(null); // { isJoined, collegeId, collegeName, university, role }
  const [loading, setLoading] = useState(true);

  // Profile + college status ek saath fetch karo
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { 
      setLoading(false); 
      return; 
    }

    try {
      // 1. Profile
      const profileRes = await api.get("api/profile/me");
      const profile = profileRes.data.profile;
      setUser(profile);

      // 2. College status
      try {
        const collegeRes = await api.get("/api/createcollege/handler");
        if (collegeRes.data?.success) {
          setCollegeStatus(collegeRes.data.collegeStatus);
        }
      } catch (_) {
        setCollegeStatus({ isJoined: false });
      }

      // 3. Socket connect karo
      if (profile?._id) {
        connectSocket(String(profile._id), profile.collegeId ? String(profile.collegeId) : null);
      }
    } catch (err) {
      localStorage.removeItem("token");
      setUser(null);
      setCollegeStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setCollegeStatus(null);
    disconnectSocket();
  };

  // Helper functions
  const refreshUser = async () => {
    await loadUser();
  };

  const refreshCollegeStatus = async () => {
    try {
      const res = await api.get("/api/createcollege/handler");
      if (res.data?.success) setCollegeStatus(res.data.collegeStatus);
    } catch (_) {}
  };

  const isProfileComplete = (userData) =>
    userData && userData.fullName && userData.fullName.length > 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        collegeStatus,
        refreshUser,
        refreshCollegeStatus,
        logout,
        isProfileComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};