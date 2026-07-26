// src/pages/DiscoverPage.jsx  (new)  — Route: /discover
//
// Premium "Global Match" feature — GET /api/discover se ranked users milte
// hain (skill/vibe/trust/mutual-collab weighted score se). Har card pe
// seedha Collab button (Instagram-follow jaisa, POST/DELETE /api/collab/:id).
import { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

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
};

function SkillChip({ label }) {
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">{label}</span>;
}

function DiscoverCard({ person, onCollabToggle }) {
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
      className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 rounded-2xl p-4 cursor-pointer transition flex flex-col"
    >
      <div className="flex items-start gap-3">
        <img
          src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName || person.username)}&background=5b54a4&color=fff`}
          alt={person.fullName}
          className="w-14 h-14 rounded-full object-cover flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm truncate">@{person.username}</p>
          <p className="text-xs text-gray-500 truncate">{person.fullName}</p>
          {person.stream && <p className="text-[11px] text-gray-600 truncate mt-0.5">🎓 {person.stream}</p>}
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full flex-shrink-0">
          {Icon.spark} {person.matchScore}%
        </span>
      </div>

      {person.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {person.skills.slice(0, 4).map((s) => <SkillChip key={s} label={s} />)}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500">
        <span>⭐ {person.trustScore || 0} Trust</span>
        <span>🤝 {person.collabCount || 0} Collabs</span>
        <span>👥 {person.friendsCount || 0} Friends</span>
      </div>

      <button
        type="button"
        onClick={toggleCollab}
        disabled={busy}
        className={`mt-3 w-full py-2 rounded-xl text-xs font-semibold transition ${
          collabing
            ? "bg-white/5 text-gray-300 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
            : "bg-brand-600 hover:bg-brand-500 text-white"
        }`}
      >
        {collabing ? "Collabing ✓" : "Collab +"}
      </button>
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

  if (loading) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (locked) return <div className="min-h-screen bg-navy-900 text-white pt-24"><PremiumLockScreen /></div>;

  return (
    <div className="min-h-screen bg-navy-900 text-white pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-1 text-brand-400">{Icon.globe}
          <h1 className="text-2xl font-extrabold text-white">Discover</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">Same skills, same vibe — from every college, matched for you.</p>

        {people.length === 0 ? (
          <p className="text-center py-20 text-gray-500 text-sm">
            No matches yet — add some skills to your profile to get better suggestions.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {people.map((p) => (
              <DiscoverCard key={p._id} person={p} onCollabToggle={handleCollabToggle} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-8">
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