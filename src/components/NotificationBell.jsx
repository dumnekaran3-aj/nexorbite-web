// src/components/NotificationBell.jsx
//
// 🎨 REDESIGN: dropdown panel ab full-page Notifications.jsx jaisa hi
// WhatsApp-style dikhta hai — bada avatar + type-color corner badge, bold
// title, readable body text (pehle sab bohot chhota/generic tha, browser
// push-notification jaisa lagta tha). Same NOTIF_META palette dono jagah
// use hoti hai taaki app mein kahin bhi notification dikhe, feel same rahe.
import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { getSocket } from "../lib/socket";

const BellIcon = ({ hasUnread }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    className={`w-5 h-5 ${hasUnread ? "text-brand-400" : "text-gray-400"}`}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

// Per-type icon + accent color — same palette as Notifications.jsx so the
// bell dropdown and the full page always feel like the same product.
const NOTIF_META = {
  friend_request:           { icon: "👋", dot: "bg-sky-500" },
  friend_accepted:          { icon: "🤝", dot: "bg-emerald-500" },
  new_message:               { icon: "💬", dot: "bg-brand-500" },
  new_group_message:         { icon: "💬", dot: "bg-brand-500" },
  new_community_member:     { icon: "🏫", dot: "bg-amber-500" },
  new_product:               { icon: "🛒", dot: "bg-emerald-500" },
  new_feed:                  { icon: "📢", dot: "bg-sky-500" },
  member_suggestion:        { icon: "🔍", dot: "bg-gray-500" },
  group_join_request:       { icon: "🙋", dot: "bg-amber-500" },
  group_join_accepted:      { icon: "🎉", dot: "bg-emerald-500" },
  group_join_declined:      { icon: "🚫", dot: "bg-red-500" },
  added_to_group:            { icon: "👥", dot: "bg-brand-500" },
  promoted_to_group_admin:  { icon: "⭐", dot: "bg-yellow-500" },
};
const DEFAULT_META = { icon: "🔔", dot: "bg-brand-500" };

function NotifItem({ notif, onRead, onNavigate }) {
  const meta   = NOTIF_META[notif.type] || DEFAULT_META;
  const sender = notif.sender;
  const unread = !notif.isRead;

  return (
    <button
      type="button"
      onClick={() => { onRead(notif._id); onNavigate(notif.url || "/"); }}
      className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition ${
        unread ? "bg-brand-500/[0.08] hover:bg-brand-500/[0.14]" : "hover:bg-white/[0.05]"
      }`}
    >
      {/* Avatar + type-badge corner icon */}
      <div className="flex-shrink-0 relative">
        {sender?.avatar ? (
          <img src={sender.avatar} alt={sender.fullName || "User"}
            className={`w-12 h-12 rounded-full object-cover ring-2 ${unread ? "ring-brand-500/60" : "ring-white/10"}`}/>
        ) : (
          <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center text-xl ring-2 ring-white/10">
            {meta.icon}
          </div>
        )}
        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] ring-2 ring-navy-900 ${meta.dot}`}>
          {meta.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm leading-tight truncate ${unread ? "font-bold text-white" : "font-semibold text-gray-300"}`}>
            {notif.title}
          </p>
          {notif.count > 1 && (
            <span className="text-[10px] min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center flex-shrink-0">
              {notif.count}
            </span>
          )}
        </div>
        <p className={`text-[13px] line-clamp-2 mt-0.5 ${unread ? "text-gray-200" : "text-gray-500"}`}>
          {notif.body}
        </p>
        <p className="text-[11px] text-gray-500 mt-1 font-medium">
          {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
          {new Date(notif.createdAt).toLocaleDateString()}
        </p>
      </div>

      {unread && notif.count <= 1 && (
        <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-brand-500 self-start mt-1.5" />
      )}
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
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border border-navy-900">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-navy-800 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-[200]">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-navy-850">
            <div>
              <h3 className="font-bold text-sm text-white">Notifications</h3>
              {unread > 0 && <p className="text-[11px] text-brand-300 font-semibold mt-0.5">{unread} unread</p>}
            </div>
            {unread > 0 && (
              <button type="button" onClick={handleReadAll}
                className="text-[11px] text-brand-300 hover:text-white font-semibold transition px-2.5 py-1 rounded-lg hover:bg-brand-500 bg-brand-500/10 border border-brand-500/30">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">
            {loading && notifs.length === 0 && (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/>
              </div>
            )}

            {!loading && notifs.length === 0 && (
              <div className="text-center py-12 px-6">
                <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center text-2xl mx-auto mb-3">
                  🔔
                </div>
                <p className="text-white text-sm font-semibold mb-0.5">All caught up!</p>
                <p className="text-gray-500 text-xs">No notifications yet</p>
              </div>
            )}

            {notifs.map((n) => (
              <NotifItem key={n._id} notif={n} onRead={handleRead} onNavigate={handleNavigate}/>
            ))}

            {hasMore && notifs.length > 0 && (
              <button type="button" onClick={loadMore} disabled={loading}
                className="w-full py-3 text-xs text-brand-300 hover:text-white hover:bg-brand-500/10 transition font-semibold">
                {loading ? "Loading..." : "Load more"}
              </button>
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2.5 text-center bg-navy-850">
              <button type="button" onClick={() => { handleNavigate("/notifications"); }}
                className="text-xs text-brand-300 hover:text-white font-semibold transition">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}