import { createContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  
  const [user, setUser] = useState(null);

  const [collegeStatus, setCollegeStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  
  // UseRef ka use karein taaki state change hone par loop na bane
  const isFetchingRef = useRef(false);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Lock check
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const [profileRes, collegeRes] = await Promise.allSettled([
        api.get("/api/profile/me"),
        api.get("/api/createcollege/handler")
      ]);

      if (profileRes.status === "fulfilled") {
        const profile = profileRes.value.data.profile;
        setUser(profile);
        
        if (profile?._id) {
          connectSocket(String(profile._id), profile.collegeId ? String(profile.collegeId) : null);
        }
      } else {
        throw new Error("Auth failed");
      }

      if (collegeRes.status === "fulfilled" && collegeRes.value.data?.success) {
        setCollegeStatus(collegeRes.value.data.collegeStatus);
      } else {
        setCollegeStatus({ isJoined: false });
      }

    } catch (err) {
      localStorage.removeItem("token");
      setUser(null);
      setCollegeStatus(null);
      disconnectSocket();
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []); // Dependencies empty rakhein

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setCollegeStatus(null);
    disconnectSocket();
    window.location.reload(); // Redirect ke badle hard reload
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        collegeStatus,
        refreshUser: loadUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};