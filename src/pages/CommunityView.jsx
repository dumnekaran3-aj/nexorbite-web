// src/pages/CommunityView.jsx
// REFACTORED:
// 1. Friends / Requests / Sent tabs REMOVED — moved to /friends (FriendsHub.jsx).
//    Only Members / Discover / Feed remain here.
// 2. Chat UI no longer duplicated inline — imported from shared
//    components/chat/ChatPanel.jsx (used by both this page and FriendsHub).
// 3. Sticky tab bar now offsets by top-[72px] (Navbar's real height) so it
//    settles below the fixed Navbar and never disappears on scroll.

import { useEffect, useState, useContext, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { getSocket } from "../lib/socket";
import { leaveCommunity } from "../lib/community.api";
import ChatPanel, { Icon, RoleBadge, ImageModal } from "../components/ChatPanel";

// ─── FeedTab ──────────────────────────────────────────────────────────────
function FeedTab({ navigate, collegeQS }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get(`/api/ecosystem/feed/get-feed${collegeQS}`);
        if (!cancelled) setItems(r.data.posts || r.data.feedItems || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [collegeQS]);
  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!items.length) return <div className="text-center py-16"><div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">{Icon.shop}</div><p className="text-gray-500 text-sm">No products in feed yet.</p></div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item, i) => {
        const p = item.product || {};
        return (
          <div key={item._id||i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-brand-500/50 transition">
            {p.thumbnailUrl && <img src={p.thumbnailUrl} alt={p.title} className="w-full h-40 object-cover"/>}
            <div className="p-4">
              <span className="text-brand-400 text-[10px] font-bold uppercase tracking-widest">{p.branch}</span>
              <h4 className="font-semibold text-sm mt-1 mb-1 line-clamp-1">{p.title}</h4>
              <p className="text-gray-500 text-xs line-clamp-2 mb-3">{p.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-brand-400 font-bold text-sm">{p.isPaid ? `₹${p.price}` : "Free"}</span>
                <div className="flex items-center gap-3 text-xs text-gray-600"><span>{p.salesCount||0} sold</span><span>{p.viewCount||0} views</span></div>
              </div>
              {item.seller && (
                <button type="button" onClick={() => navigate(`/profile/${item.seller._id}`)} className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 w-full text-left hover:opacity-80 transition">
                  <img src={item.seller.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(item.seller.fullName||"U")}&background=7c3aed&color=fff`} alt={item.seller.fullName} className="w-6 h-6 rounded-full object-cover"/>
                  <span className="text-xs text-gray-500">{item.seller.fullName}</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SuggestionsTab ───────────────────────────────────────────────────────
function SuggestionsTab({ navigate, sentIds, friendIds, onConnect, collegeQS }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/ecosystem/members/same-branch${collegeQS}`);
        if (!cancelled) setUsers(res.data.students || []);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [collegeQS]);
  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!users.length) return <p className="text-center text-gray-500 py-16 text-sm">No suggestions.</p>;
  return (
    <div className="space-y-2">
      {users.map((u) => {
        const uid = String(u._id); const isFriend = friendIds.has(uid); const isSent = sentIds.has(uid);
        return (
          <div key={u._id} className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl px-4 py-3 transition">
            <button type="button" onClick={() => navigate(`/profile/${u._id}`)}><img src={u.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName||"U")}&background=7c3aed&color=fff`} alt={u.fullName} className="w-10 h-10 rounded-full object-cover"/></button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${u._id}`)}>
              <p className="font-semibold text-sm truncate">{u.fullName}</p>
              <p className="text-xs text-gray-500 truncate">@{u.username} · {u.stream||"—"}</p>
              <RoleBadge role={u.collegeRole}/>
            </div>
            {!isFriend && <button type="button" onClick={() => onConnect(u._id)} disabled={isSent} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${isSent?"bg-navy-700/50 text-gray-500 cursor-not-allowed":"bg-brand-600 hover:bg-brand-500 text-white"}`}>{isSent?"Sent":"+ Connect"}</button>}
          </div>
        );
      })}
    </div>
  );
}

// ─── MemberCard ───────────────────────────────────────────────────────────
function MemberCard({ member, sentIds, onConnect, onChat, onProfile, friendIds }) {
  const uid = String(member._id); const isFriend = friendIds.has(uid); const isSent = sentIds.has(uid);
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl px-4 py-3 transition">
      <button type="button" onClick={() => onProfile(member)} className="flex-shrink-0"><img src={member.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName||"U")}&background=7c3aed&color=fff`} alt={member.fullName} className="w-10 h-10 rounded-full object-cover"/></button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onProfile(member)}>
        <p className="font-semibold text-sm truncate hover:text-brand-300">{member.fullName}</p>
        <p className="text-xs text-gray-500 truncate">@{member.username} · {member.stream||"—"}</p>
        <div className="mt-1"><RoleBadge role={member.role||member.collegeRole}/></div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {isFriend
          ? <button type="button" onClick={() => onChat(member)} className="px-3 py-1.5 bg-brand-600/20 text-brand-400 border border-brand-500/30 rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-brand-600/40 transition">{Icon.chat} Chat</button>
          : <button type="button" onClick={() => onConnect(member._id)} disabled={isSent} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${isSent?"bg-navy-700/50 text-gray-500 cursor-not-allowed":"bg-brand-600 hover:bg-brand-500 text-white"}`}>{isSent?"Sent":"Connect"}</button>}
      </div>
    </div>
  );
}

// ─── ProfileModal ─────────────────────────────────────────────────────────
function ProfileModal({ user: u, onClose, onChat, isFriend, isSent, onConnect, onNavigate, enlargeAvatar, setEnlargeAvatar }) {
  if (!u?._id) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">{Icon.x}</button>
          <div className="flex flex-col items-center text-center">
            <button type="button" onClick={() => setEnlargeAvatar(true)} className="cursor-zoom-in hover:scale-105 transition">
              <img src={u.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName||"U")}&background=7c3aed&color=fff&bold=true`} alt={u.fullName} className="w-20 h-20 rounded-full object-cover border-2 border-brand-500"/>
            </button>
            <h3 className="text-xl font-bold mt-3">{u.fullName}</h3>
            <p className="text-gray-500 text-sm">@{u.username}</p>
            <div className="mt-2"><RoleBadge role={u.role||u.collegeRole}/></div>
            {u.stream && <p className="text-xs text-gray-500 mt-1">🎓 {u.stream}</p>}
          </div>
          <div className="flex gap-3 mt-6">
            {isFriend
              ? <button type="button" onClick={() => { onClose(); onChat(u); }} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">{Icon.chat} Message</button>
              : <button type="button" onClick={() => onConnect(u._id)} disabled={isSent} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${isSent?"bg-navy-700 text-gray-400 cursor-not-allowed":"bg-brand-600 hover:bg-brand-500 text-white"}`}>{isSent?"Request Sent":"Connect"}</button>}
            <button type="button" onClick={() => { onClose(); onNavigate(`/profile/${u._id}`); }} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition border border-white/10">View Profile</button>
          </div>
        </div>
      </div>
      {enlargeAvatar && <ImageModal src={u.avatar} name={u.fullName} onClose={() => setEnlargeAvatar(false)} />}
    </>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
export default function CommunityView() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id: routeCollegeId } = useParams();
  const myId     = user?._id || user?.id;

  const collegeQS = routeCollegeId ? `?collegeId=${routeCollegeId}` : "";
  const withCollegeId = (params = {}) =>
    routeCollegeId ? { ...params, collegeId: routeCollegeId } : params;

  const [college, setCollege]               = useState(null);
  const [members, setMembers]               = useState([]);
  const [friends, setFriends]               = useState([]); // background only — powers Chat vs Connect state
  const [loading, setLoading]               = useState(false);
  const [activeTab, setActiveTab]           = useState("members");
  const [sentIds, setSentIds]               = useState(new Set());
  const [chatTarget, setChatTarget]         = useState(null);
  const [profileUser, setProfileUser]       = useState(null);
  const [enlargeProfile, setEnlargeProfile] = useState(false);
  const [showInfo, setShowInfo]             = useState(false);
  const [toast, setToast]                   = useState(null);
  const [hasFetched, setHasFetched]         = useState(false);
  const [myRole, setMyRole]                 = useState(null);
  const [leaving, setLeaving]               = useState(false);

  const friendIds = useMemo(() => new Set(friends.map((f) => String(f._id))), [friends]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!myId) return;
    setLoading(true); setHasFetched(true);
    try {
      const [colRes, memRes, friRes] = await Promise.allSettled([
        api.get(`/api/createcollege/my-college${collegeQS}`),
        api.get(`/api/ecosystem/members${collegeQS}`),
        api.get(`/api/ecosystem/friends/${collegeQS}`),
      ]);
      if (colRes.status === "fulfilled") {
        setCollege(colRes.value.data?.college || null);
        setMyRole(colRes.value.data?.myRole || null);
      } else {
        setCollege(null);
        setMyRole(null);
      }
      if (memRes.status === "fulfilled") setMembers(memRes.value.data?.members || []); else setMembers([]);
      if (friRes.status === "fulfilled") setFriends(friRes.value.data?.friends || []); else setFriends([]);
    } finally { setLoading(false); }
  }, [myId, collegeQS]);

  useEffect(() => {
    setHasFetched(false);
    if (!authLoading && myId) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, myId, routeCollegeId]);

  // Requests list lives on /friends now — this just gives a quick heads-up toast.
  useEffect(() => {
    if (!myId) return;
    const socket = getSocket();
    const onNewReq = () => showToast("You have a new friend request!");
    socket.on("new_friend_request", onNewReq);
    return () => socket.off("new_friend_request", onNewReq);
  }, [myId, showToast]);

  const handleLeaveCommunity = async () => {
    if (!college?._id || leaving) return;
    if (!window.confirm(`Leave "${college.college_name}"? You can rejoin later with an invite code.`)) return;
    setLeaving(true);
    try {
      const res = await leaveCommunity(college._id);
      if (res.success) {
        showToast("Left community");
        navigate("/");
      } else {
        showToast(res.msg || "Could not leave community", "error");
      }
    } finally {
      setLeaving(false);
    }
  };

  const sendRequest = async (userId) => {
    try { await api.post("/api/ecosystem/friends/request", withCollegeId({ to: userId })); setSentIds((prev) => new Set([...prev, String(userId)])); showToast("Request sent!"); }
    catch (e) { showToast(e?.response?.data?.msg || "cant send request", "error"); }
  };

  const tabs = [
    { key:"members",     label:"Members",  icon:Icon.users,   count:members.length },
    { key:"suggestions", label:"Discover", icon:Icon.suggest, count:null },
    { key:"feed",        label:"Feed",     icon:Icon.feed,    count:null },
  ];

  if (authLoading) return <div className="min-h-screen bg-navy-950 flex items-center justify-center"><div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!myId) return <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4"><div className="text-center"><p className="text-gray-400 mb-4">Login for community access</p><button type="button" onClick={() => navigate("/login")} className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition">Login</button></div></div>;
  if (loading) return <div className="min-h-screen bg-navy-950 flex items-center justify-center"><div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!college && hasFetched) return <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4"><div className="text-center max-w-sm"><div className="w-16 h-16 bg-brand-600/10 border border-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-500">{Icon.users}</div><h2 className="text-2xl font-bold mb-2">community not found</h2><p className="text-gray-500 text-sm mb-6">Invite code se college join karo.</p><button type="button" onClick={() => navigate("/")} className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition">Go Home</button></div></div>;
  if (!college) return <div className="min-h-screen bg-navy-950 flex items-center justify-center"><div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {toast && <div className={`fixed top-4 right-4 z-[200] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg ${toast.type==="error"?"bg-red-600":"bg-green-600"} text-white`}>{toast.msg}</div>}

      <div className="bg-gradient-to-b from-brand-900/30 to-transparent pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-brand-600 flex items-center justify-center text-2xl font-extrabold">
              {college.logo_url ? <img src={college.logo_url} alt="logo" className="w-full h-full object-cover"/> : college.college_name?.[0]?.toUpperCase()||"C"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight truncate">{college.college_name}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{college.university}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">{Icon.users} {college.usageCount||members.length} members</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] border font-semibold ${college.status==="active"?"bg-green-500/10 text-green-400 border-green-500/20":"bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>{college.status||"active"}</span>
              </div>
            </div>
            <button type="button" onClick={() => setShowInfo(true)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition text-gray-400">{Icon.info}</button>
          </div>
        </div>
      </div>

      {/* Sticky tabs — offset now matches the fixed Navbar's real height so
          this bar settles right below it instead of hiding behind it on scroll. */}
      <div className="sticky top-[72px] z-40 bg-navy-950/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
            {tabs.map((t) => (
              <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${activeTab===t.key?"bg-brand-600 text-white":"text-gray-500 hover:text-white hover:bg-white/5"}`}>
                {t.icon}{t.label}
                {t.count !== null && t.count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab===t.key?"bg-white/20 text-white":"bg-white/10 text-gray-400"}`}>{t.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className={activeTab==="members"?"":"hidden"}><div className="space-y-2">{members.length===0&&<p className="text-center py-16 text-gray-600 text-sm">No members found.</p>}{members.map((m)=><MemberCard key={m._id} member={m} sentIds={sentIds} friendIds={friendIds} onConnect={sendRequest} onChat={setChatTarget} onProfile={setProfileUser}/>)}</div></div>
        <div className={activeTab==="suggestions"?"":"hidden"}><SuggestionsTab navigate={navigate} sentIds={sentIds} friendIds={friendIds} onConnect={sendRequest} collegeQS={collegeQS}/></div>
        <div className={activeTab==="feed"?"":"hidden"}><FeedTab navigate={navigate} collegeQS={collegeQS}/></div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Community Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium text-right max-w-[60%] truncate">{college.college_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">University</span><span className="font-medium text-right max-w-[60%] truncate">{college.university}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Members</span><span className="font-medium">{college.usageCount||0} / {college.usageLimit||1000}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={college.status==="active"?"text-green-400":"text-yellow-400"}>{college.status}</span></div>
              {college.description && <div className="pt-3 border-t border-white/10"><p className="text-gray-500 text-xs mb-1">About</p><p className="text-gray-300 text-sm">{college.description}</p></div>}
            </div>

            {myRole !== "owner" && (
              <button
                type="button"
                disabled={leaving}
                onClick={handleLeaveCommunity}
                className="mt-4 w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {leaving ? "Leaving…" : "Leave Community"}
              </button>
            )}

            <button type="button" onClick={() => setShowInfo(false)} className="mt-3 w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition">Close</button>
          </div>
        </div>
      )}

      {profileUser && <ProfileModal user={profileUser} onClose={() => { setProfileUser(null); setEnlargeProfile(false); }} onChat={setChatTarget} isFriend={friendIds.has(String(profileUser._id))} isSent={sentIds.has(String(profileUser._id))} onConnect={sendRequest} onNavigate={navigate} enlargeAvatar={enlargeProfile} setEnlargeAvatar={setEnlargeProfile}/>}

      {chatTarget?._id && <ChatPanel friend={chatTarget} myId={String(myId)} onClose={() => setChatTarget(null)}/>}
    </div>
  );
}