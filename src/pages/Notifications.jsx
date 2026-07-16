// src/pages/Notifications.jsx
//
// Full-page version of the NotificationBell dropdown — "View all notifications"
// lands here. Same API (/api/notifications), same read/read-all/navigate
// logic, just rendered as a scrollable page instead of a small panel.

import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import api from "../lib/api";

const NOTIF_ICONS = {
  friend_request:       "👋",
  friend_accepted:      "🤝",
  new_message:          "💬",
  new_community_member: "🏫",
  new_product:          "🛒",
  new_feed:             "📢",
  member_suggestion:    "🔍",
};

function NotifRow({ notif, onRead, onNavigate }) {
  const icon   = NOTIF_ICONS[notif.type] || "🔔";
  const sender = notif.sender;

  return (
    <button
      type="button"
      onClick={() => { onRead(notif._id); onNavigate(notif.url || "/"); }}
      className={`w-full flex items-start gap-3 px-4 py-4 hover:bg-white/5 transition text-left rounded-xl ${
        !notif.isRead ? "bg-brand-500/5 border-l-2 border-brand-500" : "border-l-2 border-transparent"
      }`}
    >
      <div className="flex-shrink-0 relative mt-0.5">
        {sender?.avatar ? (
          <img src={sender.avatar} alt={sender.fullName} className="w-11 h-11 rounded-full object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-brand-600/20 flex items-center justify-center text-xl">
            {icon}
          </div>
        )}
        {!notif.isRead && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-brand-500 rounded-full border-2 border-navy-900" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-white line-clamp-1">{notif.title}</p>
          {notif.count > 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold flex-shrink-0">
              {notif.count}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{notif.body}</p>
        <p className="text-[11px] text-gray-600 mt-1.5">
          {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
          {new Date(notif.createdAt).toLocaleDateString()}
        </p>
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

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-28 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">Notifications</h1>
            {unread > 0 && <p className="text-brand-400 text-sm mt-0.5">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleReadAll}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition px-3 py-1.5 rounded-lg hover:bg-brand-500/10 border border-brand-500/30"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
          {loading && notifs.length === 0 && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {fetched && !loading && notifs.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🔔</p>
              <p className="text-gray-500 text-sm">you don't have any notifications</p>
            </div>
          )}

          {notifs.map((n) => (
            <NotifRow key={n._id} notif={n} onRead={handleRead} onNavigate={handleNavigate} />
          ))}
        </div>

        {hasMore && notifs.length > 0 && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="w-full mt-4 py-3 text-sm text-brand-400 hover:text-brand-300 hover:bg-white/5 transition font-semibold rounded-xl border border-white/10 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}