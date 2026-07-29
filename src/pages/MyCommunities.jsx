// src/pages/MyCommunities.jsx
//
// "Community cart" page — shows the user's 1 private community + all joined
// public communities, lets them join a new one by invite code, and leave
// any community they're not the owner of. Built for the Day 1 multi-community
// backend (/api/createcollege/my-communities, /join, /leave).
//
// Defensive by design: every async action is wrapped so a failed request
// shows a toast instead of crashing the page.
//
// 🔴 FIX (navbar overlap): Navbar ab do rows me hai (logo row + mobile tab
//  row) jiski total height ~100-110px ke aasapaas hoti hai (desktop pe
//  sirf ek row, ~96px). Pehle page `pt-24` (96px) use kar raha tha jo
//  mobile ke naye taller navbar ke peeche se page-heading ko upar dabaa
//  raha tha ("hide" ho raha tha). Ab `pt-28` (112px) use kiya hai jo dono
//  breakpoints pe navbar ke neeche saaf gap deta hai. Toast ka top bhi
//  isi hisaab se `top-24` kiya hai taaki wo navbar ke peeche na chhupe.
//
// 🎨 REDESIGN: official/classic dashboard-card look —
//  - Page header ab ek icon-badge + title + subtitle + quick counts ke
//    saath hai (jaisa admin/SaaS dashboards me hota hai)
//  - "Join a community" ab apna khud ka labeled card hai, icon ke saath
//  - Community cards: bada avatar (ring ke saath), cleaner badge row,
//    action buttons ab mobile pe wrap ho sakte hain (chhoti screen par
//    overlap nahi honge)
//  - Public communities ab sm+ par 2-column grid me dikhte hain (space
//    behtar use hota hai), mobile par single column
//  - Empty states ab icon + friendly text ke saath hain, sirf plain text
//    nahi

import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import { joinCommunity, leaveCommunity } from "../lib/community.api";

// ─── Small inline icons (no external icon lib needed) ──
const Icon = {
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18Z" />
    </svg>
  ),
  key: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="8" cy="15" r="4" />
      <path d="M10.5 12.5 20 3" />
      <path d="M17 6l3 3" />
      <path d="M14 9l2.5 2.5" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="8" r="2.3" />
      <path d="M2 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
      <path d="M17 15.3a4 4 0 0 1 4 4V21" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M4 12h4l2 3h4l2-3h4" />
      <path d="M5.5 6h13l1.5 6v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
};

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-24 right-4 z-[200] flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg text-white ${
        toast.type === "error" ? "bg-red-600" : "bg-green-600"
      }`}
    >
      {toast.type === "error" ? Icon.alert : Icon.check}
      {toast.msg}
    </div>
  );
}

function CommunityCard({ community, isPrivate, onOpen, onLeave, leavingId }) {
  const isOwner = community.myRole === "owner";
  const busy = leavingId === community.collegeId;

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-white/20 transition">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-600 ring-2 ring-white/10 flex items-center justify-center text-lg font-bold flex-shrink-0">
          {community.logo_url ? (
            <img src={community.logo_url} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            community.name?.[0]?.toUpperCase() || "C"
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-semibold truncate">{community.name}</p>
            <span
              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${
                isPrivate
                  ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                  : "bg-brand-500/20 text-brand-300 border-brand-500/30"
              }`}
            >
              {isPrivate ? Icon.lock : Icon.globe}
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
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 self-stretch sm:self-auto">
        <button
          type="button"
          onClick={() => onOpen(community.collegeId)}
          className="flex-1 sm:flex-none px-4 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-full text-xs font-semibold transition"
        >
          Open
        </button>
        {!isOwner && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onLeave(community.collegeId)}
            className="flex-1 sm:flex-none px-4 py-1.5 bg-white/5 hover:bg-red-500/20 hover:text-red-300 rounded-full text-xs font-semibold transition disabled:opacity-50"
          >
            {busy ? "Leaving…" : "Leave"}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-10 px-4 bg-[#0f0f0f] border border-dashed border-white/10 rounded-2xl">
      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-300">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 max-w-xs">{subtitle}</p>}
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

      {/* pt-28: navbar ki nayi height (mobile: logo row + tab row, desktop:
          single taller row) ke neeche saaf gap ke liye — pehle pt-24 tha
          jo mobile pe heading ko navbar ke peeche chhupa raha tha. */}
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">

        {/* Page header — icon badge + title + subtitle + live counts */}
        <div className="flex items-start gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center flex-shrink-0">
            {Icon.users}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold leading-tight">My Communities</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Your private community, plus every public community you've joined.
            </p>
            {!fetching && (
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  {Icon.lock} {privateCommunity ? 1 : 0} private
                </span>
                <span className="inline-flex items-center gap-1">
                  {Icon.globe} {publicCommunities.length} public
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Join by invite code */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 mb-8">
          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <span className="text-brand-400">{Icon.key}</span>
            Join a community
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Have an invite code from a friend or club? Enter it below to join.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Enter invite code"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 transition"
            />
            <button
              type="button"
              disabled={joining || !inviteCode.trim()}
              onClick={handleJoin}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap"
            >
              {joining ? "Joining…" : "Join Community"}
            </button>
          </div>
        </div>

        {fetching ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500">Loading your communities…</p>
          </div>
        ) : (
          <>
            {/* Private community */}
            <div className="mb-8">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
                {Icon.lock} Private Community
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
                <EmptyState
                  icon={Icon.lock}
                  title="No private community yet"
                  subtitle="You'll be added to your college's private community automatically once it's set up."
                />
              )}
            </div>

            {/* Public communities */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
                {Icon.globe} Public Communities ({publicCommunities.length})
              </p>
              {publicCommunities.length === 0 ? (
                <EmptyState
                  icon={Icon.inbox}
                  title="No public communities joined yet"
                  subtitle="Use an invite code above to join your first public community."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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