// src/pages/MyCommunities.jsx
//
// "Community cart" page — shows the user's 1 private community + all joined
// public communities, lets them join a new one by invite code, and leave
// any community they're not the owner of. Built for the Day 1 multi-community
// backend (/api/createcollege/my-communities, /join, /leave).
//
// Defensive by design: every async action is wrapped so a failed request
// shows a toast instead of crashing the page.

import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import { joinCommunity, leaveCommunity } from "../lib/community.api";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-20 right-4 z-[200] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg text-white ${
        toast.type === "error" ? "bg-red-600" : "bg-green-600"
      }`}
    >
      {toast.msg}
    </div>
  );
}

function CommunityCard({ community, isPrivate, onOpen, onLeave, leavingId }) {
  const isOwner = community.myRole === "owner";
  const busy = leavingId === community.collegeId;

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-600 flex items-center justify-center text-lg font-bold flex-shrink-0">
        {community.logo_url ? (
          <img src={community.logo_url} alt={community.name} className="w-full h-full object-cover" />
        ) : (
          community.name?.[0]?.toUpperCase() || "C"
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">{community.name}</p>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${
              isPrivate
                ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                : "bg-brand-500/20 text-brand-300 border-brand-500/30"
            }`}
          >
            {isPrivate ? "Private" : "Public"}
          </span>
          {isOwner && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/20 text-blue-300 font-semibold uppercase">
              Owner
            </span>
          )}
        </div>
        {community.description && (
          <p className="text-gray-500 text-xs truncate mt-0.5">{community.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onOpen(community.collegeId)}
          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-full text-xs font-semibold transition"
        >
          Open
        </button>
        {!isOwner && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onLeave(community.collegeId)}
            className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 hover:text-red-300 rounded-full text-xs font-semibold transition disabled:opacity-50"
          >
            {busy ? "Leaving…" : "Leave"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyCommunities() {
  const { communities, refreshCommunities, refreshUser, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining]       = useState(false);
  const [leavingId, setLeavingId]   = useState(null);
  const [toast, setToast]           = useState(null);
  const [fetching, setFetching]     = useState(true);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      await refreshCommunities();
      setFetching(false);
    })();
  }, [authLoading]); // eslint-disable-line

  const handleJoin = useCallback(async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const res = await joinCommunity(inviteCode.trim());
      if (res.success) {
        showToast("Joined successfully!");
        setInviteCode("");
        await Promise.all([refreshCommunities(), refreshUser()]);
      } else {
        showToast(res.msg || "Could not join community", "error");
      }
    } finally {
      setJoining(false);
    }
  }, [inviteCode, refreshCommunities, refreshUser]);

  const handleLeave = useCallback(
    async (collegeId) => {
      setLeavingId(collegeId);
      try {
        const res = await leaveCommunity(collegeId);
        if (res.success) {
          showToast("Left community");
          await Promise.all([refreshCommunities(), refreshUser()]);
        } else {
          showToast(res.msg || "Could not leave community", "error");
        }
      } finally {
        setLeavingId(null);
      }
    },
    [refreshCommunities, refreshUser]
  );

  const handleOpen = (collegeId) => navigate(`/community/${collegeId}`);

  const { privateCommunity, publicCommunities } = communities || {
    privateCommunity: null,
    publicCommunities: [],
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <Navbar />
      <Toast toast={toast} />

      <div className="max-w-2xl mx-auto px-4 pt-28 pb-16">
        <h1 className="text-2xl font-extrabold mb-1">My Communities</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your private community + every public community you've joined.
        </p>

        {/* Join by invite code */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 mb-8">
          <p className="text-sm font-semibold mb-2">Join a community</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invite code"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 transition"
            />
            <button
              type="button"
              disabled={joining || !inviteCode.trim()}
              onClick={handleJoin}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {joining ? "Joining…" : "Join"}
            </button>
          </div>
        </div>

        {fetching ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Private community */}
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
                Private Community
              </p>
              {privateCommunity ? (
                <CommunityCard
                  community={privateCommunity}
                  isPrivate
                  onOpen={handleOpen}
                  onLeave={handleLeave}
                  leavingId={leavingId}
                />
              ) : (
                <p className="text-gray-600 text-sm">
                  You haven't joined a private community yet.
                </p>
              )}
            </div>

            {/* Public communities */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
                Public Communities ({publicCommunities.length})
              </p>
              {publicCommunities.length === 0 ? (
                <p className="text-gray-600 text-sm">No public communities joined yet.</p>
              ) : (
                <div className="space-y-3">
                  {publicCommunities.map((c) => (
                    <CommunityCard
                      key={c.collegeId}
                      community={c}
                      isPrivate={false}
                      onOpen={handleOpen}
                      onLeave={handleLeave}
                      leavingId={leavingId}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}