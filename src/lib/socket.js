import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL || "https://backend-2xiu.onrender.com";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
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

  // ✅ FIX: token ab bhej rahe hain — backend ka identify handler jwt.verify()
  // karta hai, token ke bina wo hamesha fail hoke socket ko disconnect kar
  // deta tha (isliye koi bhi real-time event — chat, notifications — kabhi
  // deliver hi nahi hoti thi).
  const doIdentify = () => {
    const token = localStorage.getItem("token");
    s.emit("identify", { userId, collegeId, token });
    console.log("📡 Identified:", userId, collegeId);
  };

  if (!s.connected) {
    s.connect();
    s.once("connect", doIdentify);
  } else {
    doIdentify();
  }

  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};