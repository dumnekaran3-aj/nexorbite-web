// src/lib/socket.js
// Frontend Socket.io client — ek hi instance poori app mein use hoga

import { io } from "socket.io-client";

// FIX: localhost:5173 FRONTEND ka port hai — backend ka nahi!
// Sirf VITE_API_URL use karo, warna production backend URL fallback karo
const SOCKET_URL =
  import.meta.env.VITE_API_URL || "https://backend-2xiu.onrender.com";

// Singleton — connect sirf ek baar hoga
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,        // hum manually connect karenge login ke baad
      transports: ["websocket"],
    });
  }
  return socket;
};

// Login ke baad call karo: connectSocket(userId, collegeId)
export const connectSocket = (userId, collegeId) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  // identify event bhejo taaki server user_{userId} room mein join kare
  s.emit("identify", { userId, collegeId });
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};