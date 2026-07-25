// src/pages/PublicProfile.jsx
// Route: /profile/:userId
//
// FIX (portfolio-style redesign):
// - Skills chips, trustScore, Collab count, Friends count — sab prominent
// - Friend-request button aur Collab button DONO alag-alag hain (2 alag
//   systems: Friends = accept-required, Collab = Instagram-follow jaisa)
// - Portfolio section: unke Projects + Digital Products ka showcase grid
// - Neeche "People you may know" — mutual-friends-based suggestion cards,
//   seedha unse Friend-request bhej sakte ho ya Collab kar sakte ho
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

// ── Small shared bits ─────────────────────────────────────────────────────
function Avatar({ src, name, size = "w-28 h-28", onClick, online }) {
  return (
    <div className="relative flex-shrink-0">
      <button onClick={onClick} className={`${size} rounded-full overflow-hidden border-4 border-brand-500 flex-shrink-0 ${onClick ? "cursor-zoom-in hover:scale-105 transition" : ""}`}>
        <img
          src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=5b54a4&color=fff&bold=true`}
          alt={name}
          className="w-full h-full object-cover"
        />
      </button>
      {online && <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-navy-900" />}
    </div>
  );
}

function ImageModal({ src, name, onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-900/80 backdrop-blur-sm" onClick={onClose}>
      <img
        src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=5b54a4&color=fff&bold=true&size=256`}
        alt={name}
        className="w-72 h-72 rounded-full object-cover border-4 border-brand-500 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

const RoleBadge = ({ role }) => {
  const map = {
    owner:     "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    principal: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    hod:       "bg-teal-500/20 text-teal-300 border-teal-500/30",
    teacher:   "bg-green-500/20 text-green-300 border-green-500/30",
    student:   "bg-brand-500/20 text-brand-300 border-brand-500/30",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${map[role] || map.student}`}>
      {role || "student"}
    </span>
  );
};

function StatPill({ label, value }) {
  return (
    <div className="flex-1 bg-white/[0.03] border border-white/8 rounded-2xl px-3 py-2.5 text-center">
      <p className="text-lg font-extrabold leading-tight">{value ?? 0}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

function SkillChip({ label }) {
  return <span className="text-[11px] px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">{label}</span>;
}

function fmtLastSeen(lastSeen) {
  if (!lastSeen) return null;
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(lastSeen).toLocaleDateString();
}

// ── Portfolio item card (Project or Digital Product) ─────────────────────
function PortfolioCard({ item, type, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 rounded-2xl overflow-hidden transition"
    >
      <div className="aspect-video bg-white/5 overflow-hidden">
        {item.image || item.thumbnail ? (
          <img src={item.image || item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">
            {type === "product" ? "🛍️" : "📁"}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-bold truncate">{item.title}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
        {type === "product" && item.price != null && (
          <p className="text-xs text-brand-400 font-semibold mt-1.5">₹{item.price}</p>
        )}
        {type === "project" && (
          <p className="text-[10px] text-gray-600 mt-1.5">❤️ {item.likesCount || 0}</p>
        )}
      </div>
    </button>
  );
}

// ── "People you may know" card — friend-request AND collab, right here ──
function SuggestionCard({ person, onFriendRequest, onCollabToggle, navigate }) {
  const [requestSent, setRequestSent] = useState(false);
  const [collabing, setCollabing] = useState(false);
  const [busy, setBusy] = useState(false);

  const sendRequest = async (e) => {
    e.stopPropagation();
    if (busy || requestSent) return;
    setBusy(true);
    try {
      await onFriendRequest(person._id);
      setRequestSent(true);
    } finally {
      setBusy(false);
    }
  };

  const toggleCollab = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !collabing;
    setCollabing(next);
    try {
      await onCollabToggle(person._id, next);
    } catch {
      setCollabing(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/profile/${person._id}`)}
      className="flex-shrink-0 w-40 bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 rounded-2xl p-3 cursor-pointer transition"
    >
      <img
        src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName || person.username)}&background=5b54a4&color=fff`}
        alt={person.fullName}
        className="w-14 h-14 rounded-full object-cover mx-auto"
      />
      <p className="text-xs font-bold text-center truncate mt-2">@{person.username}</p>
      <p className="text-[10px] text-gray-500 text-center truncate">{person.fullName}</p>
      <p className="text-[10px] text-gray-600 text-center mt-1">{person.mutualFriendsCount} mutual</p>

      <div className="flex flex-col gap-1.5 mt-2">
        <button
          type="button"
          onClick={sendRequest}
          disabled={busy || requestSent}
          className={`w-full py-1.5 rounded-lg text-[10px] font-semibold transition ${
            requestSent ? "bg-white/5 text-gray-500" : "bg-brand-600 hover:bg-brand-500 text-white"
          }`}
        >
          {requestSent ? "Requested ✓" : "Add Friend"}
        </button>
        <button
          type="button"
          onClick={toggleCollab}
          disabled={busy}
          className={`w-full py-1.5 rounded-lg text-[10px] font-semibold transition border ${
            collabing ? "bg-white/5 text-gray-400 border-white/10" : "bg-transparent text-brand-300 border-brand-500/30 hover:bg-brand-500/10"
          }`}
        >
          {collabing ? "Collabing ✓" : "Collab +"}
        </button>
      </div>
    </div>
  );
}

export default function PublicProfile() {
  const { userId }      = useParams();
  const { user: me }    = useContext(AuthContext);
  const navigate        = useNavigate();

  const [profile, setProfile]           = useState(null);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [notFound, setNotFound]         = useState(false);
  const [friends, setFriends]           = useState([]);
  const [projects, setProjects]         = useState([]);
  const [products, setProducts]         = useState([]);
  const [suggestions, setSuggestions]   = useState([]);
  const [friendshipStatus, setFriendshipStatus] = useState("none");
  const [isSender, setIsSender]         = useState(false);
  const [collabing, setCollabing]       = useState(false);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [collabBusy, setCollabBusy]     = useState(false);
  const [enlargeAvatar, setEnlargeAvatar] = useState(false);
  const [toast, setToast]               = useState(null);

  const isMe = me && String(me._id) === String(userId);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!userId) return;

    const fetchAll = async () => {
      setLoading(true);
      setNotFound(false);
      setIsPrivateProfile(false);
      try {
        const profileRes = await api.get(`/api/ecosystem/friends/public-profile/${userId}`);

        if (profileRes.data?.private) {
          setProfile(profileRes.data.user);
          setIsPrivateProfile(true);
          setLoading(false);
          return; // private → skip portfolio/suggestions/friendship calls
        }

        setProfile(profileRes.data.user);

        const calls = [
          api.get("/api/projects", { params: { owner: userId, limit: 12 } }).catch(() => null),
          api.get("/api/digital-products/all", { params: { seller: userId, limit: 12 } }).catch(() => null),
        ];

        if (!isMe) {
          calls.push(api.get(`/api/ecosystem/friends/status/${userId}`).catch(() => null));
          calls.push(api.get(`/api/collab/status/${userId}`).catch(() => null));
          calls.push(api.get("/api/ecosystem/friends/suggestions", { params: { limit: 8 } }).catch(() => null));
        } else {
          calls.push(api.get("/api/ecosystem/friends/").catch(() => null));
        }

        const [projRes, prodRes, extra1, extra2, extra3] = await Promise.all(calls);

        setProjects(projRes?.data?.projects || []);
        setProducts(prodRes?.data?.data || []);

        if (!isMe) {
          if (extra1) { setFriendshipStatus(extra1.data.status || "none"); setIsSender(extra1.data.isSender || false); }
          if (extra2) setCollabing(!!extra2.data.collabing);
          if (extra3) setSuggestions(extra3.data.suggestions || []);
        } else {
          setFriends(extra1?.data?.friends || []);
        }
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [userId, isMe]);

  const sendRequest = async () => {
    setActionLoading(true);
    try {
      await api.post("/api/ecosystem/friends/request", { to: userId });
      setFriendshipStatus("pending");
      setIsSender(true);
      showToast("Friend request sent!");
    } catch (err) {
      showToast(err.response?.data?.msg || "Could not send request", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleCollab = async () => {
    if (collabBusy) return;
    setCollabBusy(true);
    const next = !collabing;
    setCollabing(next);
    try {
      if (next) await api.post(`/api/collab/${userId}`);
      else await api.delete(`/api/collab/${userId}`);
    } catch {
      setCollabing(!next);
      showToast("Collab action failed", "error");
    } finally {
      setCollabBusy(false);
    }
  };

  const openChat = async () => {
    try {
      await api.get(`/api/ecosystem/chat/direct/${userId}`);
      navigate(`/community/${me.collegeId}?chat=${userId}`);
    } catch {
      showToast("Could not open chat", "error");
    }
  };

  // ── Suggestion-card handlers (used inside the "People you may know" strip) ──
  const handleSuggestionFriendRequest = async (targetId) => {
    await api.post("/api/ecosystem/friends/request", { to: targetId });
  };
  const handleSuggestionCollabToggle = async (targetId, next) => {
    if (next) await api.post(`/api/collab/${targetId}`);
    else await api.delete(`/api/collab/${targetId}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !profile) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center text-white">
      <div className="text-center">
        <p className="text-2xl font-bold mb-2">User not found</p>
        <button onClick={() => navigate(-1)} className="text-brand-400 hover:underline mt-4 block">← Go back</button>
      </div>
    </div>
  );

  // ── Private profile — better pattern ──
  if (isPrivateProfile && !isMe) return (
    <div className="min-h-screen bg-navy-900 text-white">
      <div className="sticky top-0 z-10 bg-navy-900/95 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition text-gray-300 flex-shrink-0" aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <p className="font-semibold">@{profile.username}</p>
      </div>

      <div className="max-w-md mx-auto px-6 pt-16 text-center">
        <Avatar src={profile.avatar} name={profile.fullName || profile.username} size="w-24 h-24" onClick={() => setEnlargeAvatar(true)} />
        <h1 className="text-xl font-extrabold mt-4">{profile.fullName}</h1>
        <p className="text-gray-500 text-sm">@{profile.username}</p>
        {profile.isVerified && (
          <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">✓ Verified</span>
        )}

        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl">🔒</div>
          <h2 className="text-lg font-bold">This Account is Private</h2>
          <p className="text-gray-500 text-sm max-w-xs">Connect with @{profile.username} to see their portfolio, skills, and stats.</p>
        </div>
      </div>

      {enlargeAvatar && (
        <ImageModal src={profile.avatar} name={profile.fullName || profile.username} onClose={() => setEnlargeAvatar(false)} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg ${toast.type === "error" ? "bg-red-600" : "bg-green-600"} text-white`}>
          {toast.msg}
        </div>
      )}

      <div className="sticky top-0 z-10 bg-navy-900/95 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition text-gray-300 flex-shrink-0" aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <p className="font-semibold">@{profile.username}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header: avatar LEFT, name block RIGHT ── */}
        <div className="flex items-start gap-5">
          <Avatar
            src={profile.avatar}
            name={profile.fullName || profile.username}
            size="w-24 h-24 sm:w-28 sm:h-28"
            onClick={() => setEnlargeAvatar(true)}
            online={profile.isOnline}
          />
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-xl sm:text-2xl font-extrabold truncate">@{profile.username}</h1>
            <p className="text-gray-400 text-sm truncate">{profile.fullName}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <RoleBadge role={profile.collegeRole} />
              {profile.isVerified && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">✓ Verified</span>
              )}
              {!profile.isOnline && profile.lastSeen && (
                <span className="text-[10px] text-gray-500">Last seen {fmtLastSeen(profile.lastSeen)}</span>
              )}
              {profile.isOnline && <span className="text-[10px] text-green-400">Online</span>}
            </div>
          </div>
        </div>

        {/* ── Branch + bio ── */}
        <div className="mt-5">
          {profile.stream && <p className="text-gray-300 text-sm flex items-center gap-1.5">🎓 <span>{profile.stream}</span></p>}
          {profile.bio && <p className="text-gray-400 text-sm mt-2 leading-relaxed">{profile.bio}</p>}
        </div>

        {/* ── Skills chips ── */}
        {profile.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {profile.skills.map((s) => <SkillChip key={s} label={s} />)}
          </div>
        )}

        {/* ── Action buttons + stats ── */}
        {!isMe && (
          <div className="mt-6">
            <div className="flex items-stretch gap-2">
              {friendshipStatus === "accepted" ? (
                <button onClick={openChat} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-2xl text-sm font-semibold transition">💬 Message</button>
              ) : friendshipStatus === "pending" ? (
                <div className="flex-1 flex items-center justify-center py-2.5 rounded-2xl text-sm font-semibold text-center bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  {isSender ? "Pending ⏳" : "Respond in Community →"}
                </div>
              ) : (
                <button onClick={sendRequest} disabled={actionLoading} className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white py-2.5 rounded-2xl text-sm font-semibold transition">
                  {actionLoading ? "Sending..." : "Add Friend +"}
                </button>
              )}

              <button
                onClick={toggleCollab}
                disabled={collabBusy}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition border ${
                  collabing
                    ? "bg-white/5 text-gray-300 border-white/10"
                    : "bg-transparent text-brand-300 border-brand-500/40 hover:bg-brand-500/10"
                }`}
              >
                {collabing ? "Collabing ✓" : "Collab +"}
              </button>
            </div>

            <div className="flex items-stretch gap-3 mt-3">
              <StatPill label="Trust Score" value={profile.trustScore} />
              <StatPill label="Collaborators" value={profile.collabCount} />
              <StatPill label="Friends" value={profile.friendsCount} />
            </div>
          </div>
        )}

        {isMe && (
          <div className="mt-6">
            <button onClick={() => navigate("/profile-setup")} className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-2xl text-sm font-semibold transition">
              Edit Profile
            </button>
            <div className="flex items-stretch gap-3 mt-3">
              <StatPill label="Trust Score" value={profile.trustScore} />
              <StatPill label="Collaborators" value={profile.collabCount} />
              <StatPill label="Friends" value={profile.friendsCount ?? friends.length} />
            </div>
          </div>
        )}

        {/* ── Portfolio: Projects ── */}
        {projects.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xs font-bold mb-4 text-gray-200 uppercase tracking-wide">Projects ({projects.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {projects.map((p) => (
                <PortfolioCard key={p._id} item={p} type="project" onClick={() => navigate(`/projects/${p._id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* ── Portfolio: Digital Products ── */}
        {products.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xs font-bold mb-4 text-gray-200 uppercase tracking-wide">Digital Products ({products.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map((p) => (
                <PortfolioCard key={p._id} item={p} type="product" onClick={() => navigate(`/marketplace/${p._id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* ── Own friends list ── */}
        {isMe && friends.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xs font-bold mb-4 text-gray-200 uppercase tracking-wide">Friends ({friends.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map((f) => (
                <button key={f._id} onClick={() => navigate(`/profile/${f._id}`)} className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 rounded-2xl p-3 text-left transition">
                  <img src={f.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.fullName || "U")}&background=5b54a4&color=fff&bold=true`} alt={f.fullName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">@{f.username}</p>
                    <p className="text-xs text-gray-500 truncate">{f.fullName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── People you may know — mutual-friends based, direct actions ── */}
        {!isMe && suggestions.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xs font-bold mb-4 text-gray-200 uppercase tracking-wide">People You May Know</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {suggestions.map((s) => (
                <SuggestionCard
                  key={s._id}
                  person={s}
                  navigate={navigate}
                  onFriendRequest={handleSuggestionFriendRequest}
                  onCollabToggle={handleSuggestionCollabToggle}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {enlargeAvatar && (
        <ImageModal src={profile.avatar} name={profile.fullName || profile.username} onClose={() => setEnlargeAvatar(false)} />
      )}
    </div>
  );
}