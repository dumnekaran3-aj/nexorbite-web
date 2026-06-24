// src/pages/ProfileView.jsx
// Logged-in user ka own profile — community name + university show hoga
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

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

export default function ProfileView() {
  const { user, collegeStatus } = useContext(AuthContext);
  const navigate = useNavigate();
  const [enlargeAvatar, setEnlargeAvatar] = useState(false);

  if (!user) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 pb-16">
      <div className="max-w-2xl mx-auto bg-white/5 p-8 rounded-3xl border border-white/10">

        {/* Avatar — click to enlarge */}
        <div className="flex flex-col items-center">
          <button onClick={() => setEnlargeAvatar(true)} className="cursor-zoom-in hover:scale-105 transition">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username || "U")}&background=7c3aed&color=fff&bold=true`}
              alt={user.fullName}
              className="w-32 h-32 rounded-full border-4 border-purple-500 object-cover"
            />
          </button>
          <h2 className="text-3xl font-bold mt-4">{user.fullName}</h2>
          <p className="text-gray-400">@{user.username}</p>
          {user.isVerified && (
            <span className="mt-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
              ✓ Verified
            </span>
          )}
        </div>

        {/* Details */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/40 p-4 rounded-xl">
            <label className="text-gray-500 text-xs uppercase">Email</label>
            <p className="mt-1 text-sm">{user.email}</p>
          </div>
          <div className="bg-black/40 p-4 rounded-xl">
            <label className="text-gray-500 text-xs uppercase">Stream / Branch</label>
            <p className="mt-1 text-sm">{user.stream || "Not set"}</p>
          </div>

          {/* Community block — collegeStatus se aata hai */}
          {collegeStatus?.isJoined && (
            <div
              className="col-span-full bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl cursor-pointer hover:bg-purple-900/30 transition"
              onClick={() => navigate(`/community/${collegeStatus.collegeId}`)}
            >
              <label className="text-purple-400 text-xs uppercase font-bold">My Community</label>
              <h3 className="text-xl font-bold mt-1">{collegeStatus.collegeName}</h3>
              <p className="text-gray-400 text-sm">{collegeStatus.university}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-1 bg-purple-600 rounded text-[10px] font-bold uppercase">
                  Role: {collegeStatus.role}
                </span>
                <span className="text-xs text-purple-400 hover:underline">Open Community →</span>
              </div>
            </div>
          )}

          <div className="col-span-full bg-black/40 p-4 rounded-xl">
            <label className="text-gray-500 text-xs uppercase">Bio</label>
            <p className="mt-1 text-sm">{user.bio || "No bio added yet."}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Link to="/profile-setup" className="flex-1 text-center bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-bold transition">
            Edit Profile
          </Link>
          {collegeStatus?.isJoined && (
            <button
              onClick={() => navigate(`/community/${collegeStatus.collegeId}`)}
              className="flex-1 text-center bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-lg font-bold transition"
            >
              My Community 🏫
            </button>
          )}
        </div>
      </div>

      {enlargeAvatar && (
        <ImageModal
          src={user.avatar}
          name={user.fullName || user.username}
          onClose={() => setEnlargeAvatar(false)}
        />
      )}
    </div>
  );
}