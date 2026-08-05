// src/pages/Notifications.jsx
//
// Full-page version of the NotificationBell dropdown — "View all notifications"
// lands here. Same API (/api/notifications), same read/read-all/navigate
// logic, just rendered as a scrollable page instead of a small panel.
//
// 🎨 REDESIGN: pehle yeh generic/browser-notification jaisa flat list dikhta
// tha (chhota text, sab ek hi color ka icon). Ab WhatsApp ke chat-list jaisa
// — bada avatar, uske corner pe TYPE ke hisaab se colored icon-badge, bold
// title + readable body, aur unread ke liye NexOrbite ke apne brand-purple/
// navy palette (tailwind.config.js: navy-900 bg, brand-500 accent) mein
// highlight — taaki turant "yeh NexOrbite ka hai" feel aaye, kisi generic
// ad/OS-notification jaisa nahi.

import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import api from "../lib/api";

// ── Per-type icon + accent color — WhatsApp ke "chat type" badges jaisa ────
// Har notification-type ka apna chhota colored circle (avatar ke corner pe)
// taaki ek nazar mein pata chale yeh friend/product/message/group hai.
const NOTIF_META = {
  friend_request:          { icon: "👋", ring: "ring-sky-400/40",     dot: "bg-sky-500" },
  friend_accepted:         { icon: "🤝", ring: "ring-emerald-400/40", dot: "bg-emerald-500" },
  new_message:              { icon: "💬", ring: "ring-brand-400/40",   dot: "bg-brand-500" },
  new_group_message:        { icon: "💬", ring: "ring-brand-400/40",   dot: "bg-brand-500" },
  new_community_member:    { icon: "🏫", ring: "ring-amber-400/40",   dot: "bg-amber-500" },
  new_product:              { icon: "🛒", ring: "ring-emerald-400/40", dot: "bg-emerald-500" },
  new_feed:                 { icon: "📢", ring: "ring-sky-400/40",     dot: "bg-sky-500" },
  member_suggestion:       { icon: "🔍", ring: "ring-gray-400/40",    dot: "bg-gray-500" },
  group_join_request:      { icon: "🙋", ring: "ring-amber-400/40",   dot: "bg-amber-500" },
  group_join_accepted:     { icon: "🎉", ring: "ring-emerald-400/40", dot: "bg-emerald-500" },
  group_join_declined:     { icon: "🚫", ring: "ring-red-400/40",     dot: "bg-red-500" },
  added_to_group:           { icon: "👥", ring: "ring-brand-400/40",   dot: "bg-brand-500" },
  promoted_to_group_admin: { icon: "⭐", ring: "ring-yellow-400/40",  dot: "bg-yellow-500" },
};
const DEFAULT_META = { icon: "🔔", ring: "ring-brand-400/40", dot: "bg-brand-500" };

// "Today", "Yesterday", "This Week", "Earlier" — WhatsApp-style section
// grouping taaki list scan karna aasan lage, ek flat wall of rows na ho.
function dateGroupLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  return "Earlier";
}

function NotifRow({ notif, onRead, onNavigate }) {
  const meta   = NOTIF_META[notif.type] || DEFAULT_META;
  const sender = notif.sender;
  const unread = !notif.isRead;

  return (
    <button
      type="button"
      onClick={() => { onRead(notif._id); onNavigate(notif.url || "/"); }}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition ${
        unread ? "bg-brand-500/[0.07] hover:bg-brand-500/[0.12]" : "hover:bg-white/[0.04]"
      }`}
    >
      {/* Avatar + type-badge corner icon (WhatsApp-status-ring style) */}
      <div className="flex-shrink-0 relative">
        {sender?.avatar ? (
          <img
            src={sender.avatar}
            alt={sender.fullName || "User"}
            className={`w-14 h-14 rounded-full object-cover ring-2 ${unread ? "ring-brand-500/60" : "ring-white/10"}`}
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-navy-700 flex items-center justify-center text-2xl ring-2 ring-white/10">
            {meta.icon}
          </div>
        )}
        <span
          className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[13px] ring-2 ring-navy-900 ${meta.dot}`}
        >
          {meta.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[15px] leading-tight truncate ${unread ? "font-bold text-white" : "font-semibold text-gray-300"}`}>
            {notif.title}
          </p>
          <span className={`text-xs flex-shrink-0 ${unread ? "text-brand-300 font-semibold" : "text-gray-500"}`}>
            {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <p className={`text-sm line-clamp-2 flex-1 ${unread ? "text-gray-200" : "text-gray-500"}`}>
            {notif.body}
          </p>
          {notif.count > 1 ? (
            <span className="flex-shrink-0 text-[11px] min-w-[20px] h-5 px-1.5 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center">
              {notif.count}
            </span>
          ) : unread ? (
            <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-brand-500" />
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [notifs,  setNotifs]  = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetched, setFetched] = useState(false);

  const fetchNotifs = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/notifications?page=${pg}&limit=20`);
      const data = res.data.notifications || [];
      setNotifs((prev) => (pg === 1 ? data : [...prev, ...data]));
      setUnread(res.data.unreadCount || 0);
      setHasMore(data.length === 20);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifs(1);
  }, [user, fetchNotifs]);

  const handleRead = async (id) => {
    setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnread((prev) => Math.max(0, prev - 1));
    try { await api.put(`/api/notifications/${id}/read`); } catch { /* silent */ }
  };

  const handleReadAll = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try { await api.put("/api/notifications/read-all"); } catch { /* silent */ }
  };

  const handleNavigate = (url) => navigate(url);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNotifs(next);
  };

  // Date-section grouping — { "Today": [...], "Yesterday": [...], ... }
  const grouped = useMemo(() => {
    const groups = {};
    for (const n of notifs) {
      const label = dateGroupLabel(n.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    }
    return groups;
  }, [notifs]);
  const GROUP_ORDER = ["Today", "Yesterday", "This Week", "Earlier"];

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Notifications</h1>
            {unread > 0 && <p className="text-brand-400 text-sm mt-0.5 font-medium">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleReadAll}
              className="text-xs text-brand-300 hover:text-white font-semibold transition px-3 py-1.5 rounded-lg hover:bg-brand-500 border border-brand-500/40 bg-brand-500/10"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="bg-navy-800 border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
          {loading && notifs.length === 0 && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {fetched && !loading && notifs.length === 0 && (
            <div className="text-center py-20 px-6">
              <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center text-3xl mx-auto mb-4">
                🔔
              </div>
              <p className="text-white font-semibold mb-1">All caught up!</p>
              <p className="text-gray-500 text-sm">You don't have any notifications yet</p>
            </div>
          )}

          {GROUP_ORDER.filter((label) => grouped[label]?.length).map((label) => (
            <div key={label}>
              <div className="px-4 py-2 bg-navy-850/80 backdrop-blur sticky top-0 z-10">
                <p className="text-[11px] font-bold text-brand-300 uppercase tracking-wider">{label}</p>
              </div>
              <div className="divide-y divide-white/5">
                {grouped[label].map((n) => (
                  <NotifRow key={n._id} notif={n} onRead={handleRead} onNavigate={handleNavigate} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {hasMore && notifs.length > 0 && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="w-full mt-4 py-3 text-sm text-brand-300 hover:text-white hover:bg-brand-500/10 transition font-semibold rounded-xl border border-white/10 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}