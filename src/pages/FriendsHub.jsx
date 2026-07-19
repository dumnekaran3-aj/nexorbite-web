// src/pages/FriendsHub.jsx
// Dedicated Friends page — extracted out of CommunityView.jsx so friend
// management (Friends / Incoming requests / Sent requests) works globally
// instead of being tied to one community's UI. Opened from Navbar → Friends icon.

import { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { getSocket } from "../lib/socket";
import ChatPanel, { Icon } from "../components/ChatPanel";

// ─── FriendRow ────────────────────────────────────────────────────────────
function FriendRow({ friend, onChat, navigate }) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3">
      <button type="button" onClick={() => navigate(`/profile/${friend._id}`)}>
        <img
          src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName || "U")}&background=7c3aed&color=fff`}
          alt={friend.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />
      </button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${friend._id}`)}>
        <p className="font-semibold text-sm truncate">{friend.fullName}</p>
        <p className="text-xs text-gray-500 truncate">@{friend.username}</p>
      </div>
      <button
        type="button"
        onClick={() => onChat(friend)}
        className="px-3 py-1.5 bg-brand-600/20 text-brand-400 border border-brand-500/30 rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-brand-600/40 transition flex-shrink-0"
      >
        {Icon.chat} Chat
      </button>
    </div>
  );
}

// ─── RequestCard ──────────────────────────────────────────────────────────
function RequestCard({ request, type, onAccept, onDecline, navigate }) {
  const person = type === "incoming" ? (request.from || null) : (request.to || null);
  if (!person?._id) return null;
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3">
      <button type="button" onClick={() => navigate(`/profile/${person._id}`)}>
        <img
          src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName || "U")}&background=7c3aed&color=fff`}
          alt={person.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />
      </button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${person._id}`)}>
        <p className="font-semibold text-sm truncate">{person.fullName}</p>
        <p className="text-xs text-gray-500">@{person.username}</p>
      </div>
      {type === "incoming" && (
        <div className="flex gap-2">
          <button type="button" onClick={() => onAccept(request._id)} className="w-8 h-8 bg-green-600/20 text-green-400 border border-green-500/30 rounded-full flex items-center justify-center hover:bg-green-600/40 transition">{Icon.check}</button>
          <button type="button" onClick={() => onDecline(request._id)} className="w-8 h-8 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full flex items-center justify-center hover:bg-red-600/40 transition">{Icon.x}</button>
        </div>
      )}
      {type === "outgoing" && (
        <span className="text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">Pending</span>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
export default function FriendsHub() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const myId = user?._id || user?.id;

  const [activeTab, setActiveTab]   = useState("friends");
  const [friends, setFriends]       = useState([]);
  const [incoming, setIncoming]     = useState([]);
  const [outgoing, setOutgoing]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!myId) return;
    setLoading(true);
    try {
      const [friRes, incRes, outRes] = await Promise.allSettled([
        api.get("/api/ecosystem/friends/"),
        api.get("/api/ecosystem/friends/requests/incoming"),
        api.get("/api/ecosystem/friends/requests/outgoing"),
      ]);
      setFriends(friRes.status === "fulfilled" ? (friRes.value.data?.friends || []) : []);
      setIncoming(incRes.status === "fulfilled" ? (incRes.value.data?.requests || []) : []);
      setOutgoing(outRes.status === "fulfilled" ? (outRes.value.data?.requests || []) : []);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [myId]);

  useEffect(() => {
    if (!authLoading && myId) fetchAll();
  }, [authLoading, myId, fetchAll]);

  useEffect(() => {
    if (!myId) return;
    const socket = getSocket();
    const onNewReq = (req) => {
      setIncoming((prev) => [req, ...prev]);
      showToast("You have a new friend request!");
    };
    socket.on("new_friend_request", onNewReq);
    return () => socket.off("new_friend_request", onNewReq);
  }, [myId, showToast]);

  const acceptRequest = async (requestId) => {
    try {
      await api.post("/api/ecosystem/friends/accept", { requestId });
      showToast("Friend added! 🎉");
      fetchAll();
    } catch {
      showToast("Request accept nahi hua.", "error");
    }
  };

  const declineRequest = async (requestId) => {
    try {
      await api.post("/api/ecosystem/friends/decline", { requestId });
      setIncoming((prev) => prev.filter((r) => r._id !== requestId));
      showToast("Request declined");
    } catch {
      showToast("Request decline nahi hua.", "error");
    }
  };

  const tabs = [
    { key: "friends",  label: "Friends",  icon: Icon.friends, count: friends.length },
    { key: "incoming", label: "Requests", icon: Icon.inbox,   count: incoming.length },
    { key: "outgoing", label: "Sent",     icon: Icon.send2,   count: outgoing.length },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!myId) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Login for friends access</p>
          <button type="button" onClick={() => navigate("/login")} className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition">Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {toast && (
        <div className={`fixed top-20 right-4 z-[200] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg ${toast.type === "error" ? "bg-red-600" : "bg-green-600"} text-white`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-b from-brand-900/30 to-transparent pt-24 pb-6 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition text-gray-400 flex-shrink-0">
            {Icon.back}
          </button>
          <div className="w-11 h-11 rounded-2xl bg-brand-600 flex items-center justify-center flex-shrink-0">
            {Icon.friends}
          </div>
          <div>
            <h1 className="text-xl font-extrabold leading-tight">Friends</h1>
            <p className="text-gray-500 text-xs mt-0.5">Manage connections across all your communities</p>
          </div>
        </div>
      </div>

      {/* Sticky tabs — settles right below the fixed Navbar, never hides on scroll */}
      <div className="sticky top-[72px] z-40 bg-navy-950/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${activeTab === t.key ? "bg-brand-600 text-white" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
              >
                {t.icon}{t.label}
                {t.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === t.key ? "bg-white/20 text-white" : "bg-white/10 text-gray-400"}`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading && !hasFetched && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {hasFetched && (
          <>
            <div className={activeTab === "friends" ? "" : "hidden"}>
              <div className="space-y-2">
                {friends.length === 0 && <p className="text-center py-16 text-gray-500 text-sm">No friends yet. join community find expand network!</p>}
                {friends.map((f) => <FriendRow key={f._id} friend={f} onChat={setChatTarget} navigate={navigate} />)}
              </div>
            </div>

            <div className={activeTab === "incoming" ? "" : "hidden"}>
              <div className="space-y-2">
                {incoming.length === 0 && <p className="text-center py-16 text-gray-600 text-sm">No incoming request</p>}
                {incoming.map((r) => <RequestCard key={r._id} request={r} type="incoming" onAccept={acceptRequest} onDecline={declineRequest} navigate={navigate} />)}
              </div>
            </div>

            <div className={activeTab === "outgoing" ? "" : "hidden"}>
              <div className="space-y-2">
                {outgoing.length === 0 && <p className="text-center py-16 text-gray-600 text-sm">NO pending request.</p>}
                {outgoing.map((r) => <RequestCard key={r._id} request={r} type="outgoing" navigate={navigate} />)}
              </div>
            </div>
          </>
        )}
      </div>

      {chatTarget?._id && <ChatPanel friend={chatTarget} myId={String(myId)} onClose={() => setChatTarget(null)} />}
    </div>
  );
}