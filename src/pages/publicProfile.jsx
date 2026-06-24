// src/pages/PublicProfile.jsx
// Route: /profile/:userId
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

// ── Avatar with click-to-enlarge ─────────────────────────────────────────
function Avatar({ src, name, size = "w-28 h-28", onClick }) {
  return (
    <button onClick={onClick} className={`${size} rounded-full overflow-hidden border-4 border-purple-500 flex-shrink-0 ${onClick ? "cursor-zoom-in hover:scale-105 transition" : ""}`}>
      <img
        src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=7c3aed&color=fff&bold=true`}
        alt={name}
        className="w-full h-full object-cover"
      />
    </button>
  );
}

function ImageModal({ src, name, onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <img
        src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=7c3aed&color=fff&bold=true&size=256`}
        alt={name}
        className="w-72 h-72 rounded-full object-cover border-4 border-purple-500 shadow-2xl"
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
    student:   "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${map[role] || map.student}`}>
      {role || "student"}
    </span>
  );
};

export default function PublicProfile() {
  const { userId }      = useParams();
  const { user: me }    = useContext(AuthContext);
  const navigate        = useNavigate();

  const [profile, setProfile]           = useState(null);
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
      try {
        // 1. Public profile
        const profileRes = await api.get(`/api/ecosystem/friends/public-profile/${userId}`);
        setProfile(profileRes.data.user);

        // 2. Friends list of this user (only if they are public)
        // We show friends of the viewed user — fetched from our friends endpoint
        // (We only show mutual/accepted friends visible to us)
        if (!isMe) {
          try {
            const statusRes = await api.get(`/api/ecosystem/friends/status/${userId}`);
            setFriendshipStatus(statusRes.data.status || "none");
            setIsSender(statusRes.data.isSender || false);
          } catch (_) {}
        }

        // 3. Friends list — show viewed user's friends if public
        // We use our own friends endpoint and filter, OR just show our own friends on our profile
        if (isMe) {
          const friendsRes = await api.get("/api/ecosystem/friends/");
          setFriends(friendsRes.data.friends || []);
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setProfile({ isPrivate: true });
        } else {
          setProfile(null);
        }
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
      const res = await api.get(`/api/ecosystem/chat/direct/${userId}`);
      // Navigate to community with chat open — or handle globally
      navigate(`/community/${me.collegeId}?chat=${userId}`);
    } catch (err) {
      showToast("Could not open chat", "error");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="text-center">
        <p className="text-2xl font-bold mb-2">User not found</p>
        <button onClick={() => navigate(-1)} className="text-purple-400 hover:underline mt-4 block">← Go back</button>
      </div>
    </div>
  );

  if (profile.isPrivate && !isMe) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-4xl">🔒</div>
        <h2 className="text-2xl font-bold mb-2">Private Account</h2>
        <p className="text-gray-500 text-sm">This user's profile is private.</p>
        <button onClick={() => navigate(-1)} className="mt-6 text-purple-400 hover:underline">← Go back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 pb-16">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg ${toast.type === "error" ? "bg-red-600" : "bg-green-600"} text-white`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-2xl mx-auto">

        {/* ── Profile Card ── */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="flex flex-col items-center text-center">
            <Avatar
              src={profile.avatar}
              name={profile.fullName || profile.username}
              size="w-28 h-28"
              onClick={() => setEnlargeAvatar(true)}
            />
            <h1 className="text-2xl font-extrabold mt-4">{profile.fullName}</h1>
            <p className="text-gray-500">@{profile.username}</p>

            <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
              <RoleBadge role={profile.collegeRole} />
              {profile.isVerified && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                  ✓ Verified
                </span>
              )}
            </div>

            {profile.stream && (
              <p className="text-gray-400 text-sm mt-2">🎓 {profile.stream}</p>
            )}
            {profile.bio && (
              <p className="text-gray-400 text-sm mt-3 max-w-sm leading-relaxed">{profile.bio}</p>
            )}
          </div>

          {/* ── Action Buttons ── */}
          {!isMe && (
            <div className="flex gap-3 mt-6">
              {friendshipStatus === "accepted" ? (
                <button
                  onClick={openChat}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  💬 Message
                </button>
              ) : friendshipStatus === "pending" ? (
                <div className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  {isSender ? "Request Sent ⏳" : "Respond in Community →"}
                </div>
              ) : (
                <button
                  onClick={sendRequest}
                  disabled={actionLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  {actionLoading ? "Sending..." : "Connect +"}
                </button>
              )}
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition border border-white/10"
              >
                ← Back
              </button>
            </div>
          )}

          {isMe && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => navigate("/profile-setup")}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* ── Friends Section (only on own profile) ── */}
        {isMe && friends.length > 0 && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-3xl p-6">
            <h2 className="text-lg font-bold mb-4">Friends ({friends.length})</h2>
            <div className="grid grid-cols-2 gap-3">
              {friends.map((f) => (
                <button
                  key={f._id}
                  onClick={() => navigate(`/profile/${f._id}`)}
                  className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 rounded-2xl p-3 text-left transition"
                >
                  <img
                    src={f.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.fullName || "U")}&background=7c3aed&color=fff&bold=true`}
                    alt={f.fullName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{f.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">@{f.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enlarge Avatar Modal */}
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