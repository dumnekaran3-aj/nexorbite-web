// src/pages/DiscoverPage.jsx  (revised)  — Route: /discover
//
// Premium "Global Match" feature — GET /api/discover se ranked users milte
// hain (skill/vibe/trust/mutual-collab weighted score se). Ab cards "product"
// jaisa nahi, balki WhatsApp-style contact list row jaisa lagte hain — same
// saari info (skills, trust, collabs, friends, match%, stream) bas ek clean,
// professional list layout me. Colors same rakhe he (navy/brand palette).
import { useEffect, useState, useCallback, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

// ---- Professional (stroke-based) icon set — no emoji, no cartoon glyphs ----
const Icon = {
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-10 h-10">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z" />
    </svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="m2 20 2-11 5 4 3-8 3 8 5-4 2 11Z" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
      <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  cap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-3 h-3">
      <path d="M2 9.5 12 4l10 5.5-10 5.5-10-5.5Z" />
      <path d="M6 12v4c0 1.5 3 3 6 3s6-1.5 6-3v-4" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-3 h-3">
      <path d="M12 3 4.5 6v6c0 4.5 3.2 7.4 7.5 9 4.3-1.6 7.5-4.5 7.5-9V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  handshake: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-3 h-3">
      <path d="M8 12 3 8l3-3 5 4h3l4-3 3 3-6 5-2-1.5" />
      <path d="M8 12 6 14a2 2 0 0 0 2.8 2.8L11 14l1.5 1.5a2 2 0 0 0 2.8-2.8" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-3 h-3">
      <circle cx="9" cy="8" r="3" /><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      <circle cx="17" cy="9" r="2.3" /><path d="M17.5 14.2c2.6.4 4.5 2.4 4.5 4.8" />
    </svg>
  ),
  addUser: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2" />
      <path d="M19 8v5M16.5 10.5h5" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="m5 12 5 5 9-10" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
};

function SkillChip({ label }) {
  return (
    <span className="text-[10px] leading-none px-2 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 whitespace-nowrap">
      {label}
    </span>
  );
}

// Single row — modeled on a contact/chat list entry: avatar + identity block +
// trailing action, not a "product tile". Every field from the original card
// (stream, skills, trust, collabs, friends, match%) is preserved.
function DiscoverRow({ person, onCollabToggle }) {
  const navigate = useNavigate();
  const [collabing, setCollabing] = useState(!!person.isCollabing);
  const [busy, setBusy] = useState(false);

  const toggleCollab = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !collabing;
    setCollabing(next); // optimistic
    try {
      await onCollabToggle(person._id, next);
    } catch {
      setCollabing(!next); // revert on failure
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/profile/${person._id}`)}
      className="group flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] active:bg-white/[0.05] cursor-pointer transition"
    >
      <img
        src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName || person.username)}&background=5b54a4&color=fff`}
        alt={person.fullName}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-sm truncate">@{person.username}</p>
          <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
            {Icon.spark} {person.matchScore}%
          </span>
        </div>

        <p className="text-xs text-gray-500 truncate mt-0.5">
          {person.fullName}
          {person.stream && (
            <span className="inline-flex items-center gap-1 ml-2 text-gray-600">
              {Icon.cap} {person.stream}
            </span>
          )}
        </p>

        {person.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {person.skills.slice(0, 4).map((s) => <SkillChip key={s} label={s} />)}
          </div>
        )}

        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">{Icon.shield} {person.trustScore || 0} Trust</span>
          <span className="flex items-center gap-1">{Icon.handshake} {person.collabCount || 0} Collabs</span>
          <span className="flex items-center gap-1">{Icon.users} {person.friendsCount || 0} Friends</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={toggleCollab}
          disabled={busy}
          title={collabing ? "Collabing" : "Collab"}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
            collabing
              ? "bg-white/5 text-brand-300 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
              : "bg-brand-600 hover:bg-brand-500 text-white"
          }`}
        >
          {collabing ? Icon.check : Icon.addUser}
        </button>
        <span className="text-gray-700 hidden sm:block">{Icon.chevron}</span>
      </div>
    </div>
  );
}

// Shown when the backend returns 403 PREMIUM_REQUIRED
function PremiumLockScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-5">
        {Icon.crown}
      </div>
      <h1 className="text-2xl font-extrabold mb-2">Discover is a Premium Feature</h1>
      <p className="text-gray-500 text-sm max-w-sm mb-6">
        Find same-skill, same-vibe people from every college on NexOrbite — matched by your skills, stream, and trust score.
      </p>
      <button
        onClick={() => navigate("/profile")}
        className="bg-gradient-to-r from-yellow-500 to-brand-500 text-navy-950 font-bold px-6 py-3 rounded-full text-sm hover:opacity-90 transition"
      >
        Upgrade to Premium
      </button>
    </div>
  );
}

export default function DiscoverPage() {
  const { user } = useContext(AuthContext);
  const [people, setPeople]     = useState([]);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(true);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [locked, setLocked]     = useState(false);
  const [query, setQuery]       = useState("");

  const fetchPage = useCallback(async (pageNum) => {
    try {
      const res = await api.get("/api/discover", { params: { page: pageNum, limit: 20 } });
      setPeople((prev) => (pageNum === 1 ? res.data.users : [...prev, ...res.data.users]));
      setHasMore(!!res.data.hasMore);
      setLocked(false);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === "PREMIUM_REQUIRED") {
        setLocked(true);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    fetchPage(next);
  };

  const handleCollabToggle = async (userId, next) => {
    if (next) await api.post(`/api/collab/${userId}`);
    else await api.delete(`/api/collab/${userId}`);
  };

  // Client-side filter on top of the ranked list — search never re-triggers
  // the ranking API, so scroll position and optimistic collab state stay put.
  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) =>
      p.username?.toLowerCase().includes(q) ||
      p.fullName?.toLowerCase().includes(q) ||
      p.stream?.toLowerCase().includes(q) ||
      p.skills?.some((s) => s.toLowerCase().includes(q))
    );
  }, [people, query]);

  if (loading) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (locked) return <div className="min-h-screen bg-navy-900 text-white pt-24"><PremiumLockScreen /></div>;

  return (
    // pt-24 keeps the app's top nav fully visible/untouched — nothing here
    // is fixed above it, the search bar only sticks *below* the nav.
    <div className="min-h-screen bg-navy-900 text-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-0 sm:px-4">
        <div className="flex items-center gap-3 mb-1 px-4 sm:px-0 text-brand-400">{Icon.globe}
          <h1 className="text-2xl font-extrabold text-white">Discover</h1>
        </div>
        <p className="text-gray-500 text-sm mb-4 px-4 sm:px-0">Same skills, same vibe — from every college, matched for you.</p>

        {/* Scalable search bar — full-width pill on mobile, comfortably
            centered/inset on desktop, sticky just under the page's own
            heading (never over the app nav). */}
        <div className="sticky top-16 sm:top-20 z-30 bg-navy-900/95 backdrop-blur px-4 sm:px-0 pb-3 pt-1 -mx-0">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-4 py-2.5 sm:py-3 focus-within:border-brand-500/40 transition">
            <span className="text-gray-500">{Icon.search}</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, stream or skill"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-600"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[11px] text-gray-500 hover:text-gray-300 px-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="sm:rounded-2xl sm:border sm:border-white/8 sm:overflow-hidden bg-navy-900 sm:bg-white/[0.015]">
          {filteredPeople.length === 0 ? (
            <p className="text-center py-20 text-gray-500 text-sm px-4">
              {query
                ? "No one matches your search."
                : "No matches yet — add some skills to your profile to get better suggestions."}
            </p>
          ) : (
            filteredPeople.map((p) => (
              <DiscoverRow key={p._id} person={p} onCollabToggle={handleCollabToggle} />
            ))
          )}
        </div>

        {hasMore && !query && (
          <div className="flex justify-center mt-6 px-4 sm:px-0">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-semibold transition disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}