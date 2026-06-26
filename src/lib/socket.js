// src/lib/socket.js
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL || "https://backend-2xiu.onrender.com";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      // FIX: websocket-only Render pe fail hota hai — polling fallback zaroori hai
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });
    socket.on("connect_error", (err) => {
      console.warn("❌ Socket connect_error:", err.message);
    });
    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });
  }
  return socket;
};

export const connectSocket = (userId, collegeId) => {
  const s = getSocket();

  // FIX: Agar socket pehle se connected hai toh sirf identify emit karo
  // dobara connect() call karne se duplicate listeners lagte the
  if (!s.connected) {
    s.connect();
    // connect hone ke baad identify bhejo
    s.once("connect", () => {
      s.emit("identify", { userId, collegeId });
      console.log("📡 Identified:", userId, collegeId);
    });
  } else {
    // Already connected — seedha identify
    s.emit("identify", { userId, collegeId });
  }

  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null; // FIX: null karo taaki reconnect pe fresh instance mile
  }
};