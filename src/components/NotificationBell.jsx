// src/components/NotificationBell.jsx
import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { getSocket } from "../lib/socket";

const BellIcon = ({ hasUnread }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    className={`w-5 h-5 ${hasUnread ? "text-purple-400" : "text-gray-400"}`}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const NOTIF_ICONS = {
  friend_request:       "👋",
  friend_accepted:      "🤝",
  new_message:          "💬",
  new_community_member: "🏫",
  new_product:          "🛒",
  new_feed:             "📢",
  member_suggestion:    "🔍",
};

function NotifItem({ notif, onRead, onNavigate }) {
  const icon   = NOTIF_ICONS[notif.type] || "🔔";
  const sender = notif.sender;

  return (
    <button
      type="button"
      onClick={() => { onRead(notif._id); onNavigate(notif.url || "/"); }}
      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition text-left ${
        !notif.isRead ? "bg-purple-500/5 border-l-2 border-purple-500" : "border-l-2 border-transparent"
      }`}
    >
      {/* Avatar / icon */}
      <div className="flex-shrink-0 relative mt-0.5">
        {sender?.avatar ? (
          <img src={sender.avatar} alt={sender.fullName}
            className="w-9 h-9 rounded-full object-cover"/>
        ) : (
          <div className="w-9 h-9 rounded-full bg-purple-600/20 flex items-center justify-center text-lg">
            {icon}
          </div>
        )}
        {!notif.isRead && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-purple-500 rounded-full border border-black"/>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-white line-clamp-1">{notif.title}</p>
          {/* ✅ NEW: count badge — jab isi conversation ke multiple messages group hue ho */}
          {notif.count > 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex-shrink-0">
              {notif.count}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.body}</p>
        <p className="text-[10px] text-gray-600 mt-1">
          {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
          {new Date(notif.createdAt).toLocaleDateString()}
        </p>
      </div>
    </button>
  );
}

export default function NotificationBell() {
  const { user } = useContext(AuthContext);
  const navigate  = useNavigate();

  const [open,        setOpen]        = useState(false);
  const [notifs,      setNotifs]      = useState([]);
  const [unread,      setUnread]      = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [animating,   setAnimating]   = useState(false);

  const dropdownRef = useRef(null);
  const hasFetched  = useRef(false);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch unread count on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const res = await api.get("/api/notifications/unread-count");
        setUnread(res.data.count || 0);
      } catch { /* silent */ }
    };
    fetchCount();
  }, [user]);

  // ── Real-time socket listener ─────────────────────────────────────────────
  // ✅ FIX: ab "open" pe depend nahi karta — list hamesha fresh rehti hai,
  // chahe panel band ho. Aur "isUpdate" flag ke hisaab se decide karta hai
  // ki ye ek NAYE notification ki tarah treat karna hai ya EXISTING wale
  // (same conversation, grouped message) ko replace karna hai.
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    const onNewNotif = (data) => {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);

      setNotifs((prev) => {
        // Existing entry (agar ho) hatao, fresh data ko top pe le aao.
        // "isUpdate: false" (bilkul naya notification) ke liye bhi ye
        // safe hai — filter yahan no-op rahega kyunki wo _id list mein
        // hoga hi nahi.
        const filtered = prev.filter((n) => n._id !== data._id);
        return [data, ...filtered];
      });

      // ✅ FIX: sirf tabhi unread++ karo jab ye GENUINELY naya notification ho.
      // "isUpdate: true" matlab same conversation ka existing unread
      // notification hi update hua hai — usay pehle hi count kiya ja chuka tha,
      // dobara badhane se count galat ho jaata (4 messages = unread 4 dikhta,
      // jabki actual mein 1 hi unread "thread" hai).
      if (!data.isUpdate) {
        setUnread((prev) => prev + 1);
      }
    };

    socket.on("new_notification", onNewNotif);
    return () => socket.off("new_notification", onNewNotif);
  }, [user]);

  // ── Fetch notifications (lazy — sirf jab panel open ho) ──────────────────
  const fetchNotifs = useCallback(async (pg = 1) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/notifications?page=${pg}&limit=20`);
      const data = res.data.notifications || [];
      if (pg === 1) {
        setNotifs(data);
      } else {
        setNotifs((prev) => [...prev, ...data]);
      }
      setUnread(res.data.unreadCount || 0);
      setHasMore(data.length === 20);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleOpen = () => {
    setOpen((v) => {
      const next = !v;
      if (next && !hasFetched.current) {
        hasFetched.current = true;
        fetchNotifs(1);
      }
      return next;
    });
  };

  const handleRead = async (id) => {
    setNotifs((prev) =>
      prev.map((n) => n._id === id ? { ...n, isRead: true } : n)
    );
    setUnread((prev) => Math.max(0, prev - 1));
    try { await api.put(`/api/notifications/${id}/read`); } catch { /* silent */ }
  };

  const handleReadAll = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try { await api.put("/api/notifications/read-all"); } catch { /* silent */ }
  };

  const handleNavigate = (url) => {
    setOpen(false);
    navigate(url);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNotifs(next);
  };

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Bell Button */}
      <button
        type="button"
        onClick={handleOpen}
        className={`relative p-2 rounded-xl transition ${
          open ? "bg-white/10" : "hover:bg-white/5"
        } ${animating ? "animate-bounce" : ""}`}
        aria-label="Notifications"
      >
        <BellIcon hasUnread={unread > 0} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border border-black">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200]">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div>
              <h3 className="font-bold text-sm">Notifications</h3>
              {unread > 0 && <p className="text-[10px] text-purple-400">{unread} unread</p>}
            </div>
            {unread > 0 && (
              <button type="button" onClick={handleReadAll}
                className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold transition px-2 py-1 rounded-lg hover:bg-purple-500/10">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
            {loading && notifs.length === 0 && (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
              </div>
            )}

            {!loading && notifs.length === 0 && (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-gray-500 text-sm">Koi notification nahi abhi</p>
              </div>
            )}

            {notifs.map((n) => (
              <NotifItem key={n._id} notif={n} onRead={handleRead} onNavigate={handleNavigate}/>
            ))}

            {hasMore && notifs.length > 0 && (
              <button type="button" onClick={loadMore} disabled={loading}
                className="w-full py-3 text-xs text-purple-400 hover:text-purple-300 hover:bg-white/5 transition font-semibold">
                {loading ? "Loading..." : "Load more"}
              </button>
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2 text-center">
              <button type="button" onClick={() => { handleNavigate("/notifications"); }}
                className="text-xs text-gray-500 hover:text-white transition">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}