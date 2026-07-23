// src/pages/PublicProfile.jsx
// Route: /profile/:userId
//
// FIX (full redesign):
// - Card wrapper hataya — ab poori screen use hoti hai, proper "← Back" header.
// - Layout: avatar LEFT side, username+fullName seedhe uske RIGHT side, phir
//   branch(stream) + bio niche, phir Connect button + trustScore +
//   collaborators count ek row me side-by-side.
// - trustScore/collabCount/friendsCount backend se ab aate hain
//   (Eco.friends.controller.js ka publicprofile fix — pehle bhejta hi nahi tha).
// - Private profile: backend ab 403 error ki jagah 200 OK + minimal info +
//   "private:true" flag bhejta hai, isliye ab isko catch(err) se nahi,
//   response flag se handle karte hain — aur ek behtar (Instagram jaisa)
//   pattern dikhate hain (avatar+naam dikhta hai, bas stats/bio nahi).
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { getRoleDisplay } from "../lib/roleTiers";

// ── Avatar with click-to-enlarge ─────────────────────────────────────────
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
      {getRoleDisplay(role || "student")}
    </span>
  );
};

// ── Stat pill — trustScore / collaborators / friends ─────────────────────
function StatPill({ label, value }) {
  return (
    <div className="flex-1 bg-white/[0.03] border border-white/8 rounded-2xl px-3 py-2.5 text-center">
      <p className="text-lg font-extrabold leading-tight">{value ?? 0}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

function fmtLastSeen(lastSeen) {
  if (!lastSeen) return null;
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(lastSeen).toLocaleDateString();
}

export default function PublicProfile() {
  const { userId }      = useParams();
  const { user: me }    = useContext(AuthContext);
  const navigate        = useNavigate();

  const [profile, setProfile]           = useState(null);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [notFound, setNotFound]         = useState(false);
  const [friends, setFriends]           = useState([]);
  const [friendshipStatus, setFriendshipStatus] = useState("none"); // none | pending | accepted | blocked
  const [isSender, setIsSender]         = useState(false);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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
        // 1. Public profile
        const profileRes = await api.get(`/api/ecosystem/friends/public-profile/${userId}`);

        // FIX: private account ab yahin flag se pata chalta hai (backend
        // 200 OK deta hai ab), 403 catch se nahi.
        if (profileRes.data?.private) {
          setProfile(profileRes.data.user);
          setIsPrivateProfile(true);
        } else {
          setProfile(profileRes.data.user);
        }

        // 2. Friendship status (only relevant for public profiles)
        if (!isMe && !profileRes.data?.private) {
          try {
            const statusRes = await api.get(`/api/ecosystem/friends/status/${userId}`);
            setFriendshipStatus(statusRes.data.status || "none");
            setIsSender(statusRes.data.isSender || false);
          } catch (_) {}
        }

        // 3. Friends list — only on own profile
        if (isMe) {
          const friendsRes = await api.get("/api/ecosystem/friends/");
          setFriends(friendsRes.data.friends || []);
        }
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        else setNotFound(true);
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

  const openChat = async () => {
    try {
      await api.get(`/api/ecosystem/chat/direct/${userId}`);
      navigate(`/community/${me.collegeId}?chat=${userId}`);
    } catch (err) {
      showToast("Could not open chat", "error");
    }
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

  // ── Private profile — better pattern: avatar + name still visible,
  // just no stats/bio/branch, with a clear lock state (like Instagram) ──
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
          <p className="text-gray-500 text-sm max-w-xs">Connect with @{profile.username} to see their branch, bio, and stats.</p>
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

      {/* Sticky header — real Back option, no card wrapper anywhere below */}
      <div className="sticky top-0 z-10 bg-navy-900/95 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition text-gray-300 flex-shrink-0" aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <p className="font-semibold">@{profile.username}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header row: avatar LEFT, name block RIGHT ── */}
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

        {/* ── Branch + bio, right below the header block ── */}
        <div className="mt-5">
          {profile.stream && (
            <p className="text-gray-300 text-sm flex items-center gap-1.5">🎓 <span>{profile.stream}</span></p>
          )}
          {profile.bio && (
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* ── Connect button + trustScore + collaborators, side-by-side ── */}
        {!isMe && (
          <div className="flex items-stretch gap-3 mt-6">
            <div className="flex-[1.4]">
              {friendshipStatus === "accepted" ? (
                <button
                  onClick={openChat}
                  className="w-full h-full bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-2xl text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  💬 Message
                </button>
              ) : friendshipStatus === "pending" ? (
                <div className="w-full h-full flex items-center justify-center py-2.5 rounded-2xl text-sm font-semibold text-center bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  {isSender ? "Already Connected — Pending ⏳" : "Respond in Community →"}
                </div>
              ) : (
                <button
                  onClick={sendRequest}
                  disabled={actionLoading}
                  className="w-full h-full bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white py-2.5 rounded-2xl text-sm font-semibold transition"
                >
                  {actionLoading ? "Sending..." : "Connect +"}
                </button>
              )}
            </div>
            <StatPill label="Trust Score" value={profile.trustScore} />
            <StatPill label="Collaborators" value={profile.collabCount} />
          </div>
        )}

        {isMe && (
          <div className="flex items-stretch gap-3 mt-6">
            <button
              onClick={() => navigate("/profile-setup")}
              className="flex-[1.4] bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-2xl text-sm font-semibold transition"
            >
              Edit Profile
            </button>
            <StatPill label="Trust Score" value={profile.trustScore} />
            <StatPill label="Collaborators" value={profile.collabCount} />
            <StatPill label="Friends" value={profile.friendsCount ?? friends.length} />
          </div>
        )}

        {/* ── Friends Section (only on own profile) ── */}
        {isMe && friends.length > 0 && (
          <div className="mt-10">
            <h2 className="text-base font-bold mb-4 text-gray-200 uppercase tracking-wide text-xs">Friends ({friends.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map((f) => (
                <button
                  key={f._id}
                  onClick={() => navigate(`/profile/${f._id}`)}
                  className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 rounded-2xl p-3 text-left transition"
                >
                  <img
                    src={f.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.fullName || "U")}&background=5b54a4&color=fff&bold=true`}
                    alt={f.fullName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">@{f.username}</p>
                    <p className="text-xs text-gray-500 truncate">{f.fullName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {enlargeAvatar && (
        <ImageModal
          src={profile.avatar}
          name={profile.fullName || profile.username}
          onClose={() => setEnlargeAvatar(false)}
        />
      )}
    </div>
  );
}