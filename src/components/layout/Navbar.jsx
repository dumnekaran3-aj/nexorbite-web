import { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import NotificationBell from "../NotificationBell";
import api from "../../lib/api";

// ─── Professional line-icons (no emoji) ───────────────────────────────────
const NavIcon = {
  communities: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 21V9l9-6 9 6v12" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  marketplace: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  friends: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

export default function Navbar({ onAboutClick }) {
  const [open, setOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const [pendingCount, setPendingCount] = useState(0);

  // Small badge — how many friend requests are waiting for this user
  useEffect(() => {
    if (!user) { setPendingCount(0); return; }
    let cancelled = false;
    api.get("/api/ecosystem/friends/requests/incoming")
      .then((res) => { if (!cancelled) setPendingCount(res.data?.count || 0); })
      .catch(() => { if (!cancelled) setPendingCount(0); });
    return () => { cancelled = true; };
  }, [user]);

  return (
    <nav className="fixed top-0 w-full z-50 bg-navy-900/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="text-white font-bold text-2xl tracking-tight flex-shrink-0">
          Nex<span className="text-brand-500">Orbite</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          {onAboutClick && (
            <button onClick={onAboutClick} className="hover:text-white transition">
              About NexOrbite
            </button>
          )}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {user && (
            <Link
              to="/my-communities"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-500/40 hover:border-brand-400 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 hover:text-white text-sm font-semibold transition"
            >
              {NavIcon.communities} Communities
            </Link>
          )}

          {user && (
            <Link
              to="/friends"
              className="relative inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-500/40 hover:border-brand-400 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 hover:text-white text-sm font-semibold transition"
            >
              {NavIcon.friends} Friends
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </Link>
          )}

          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-500/40 hover:border-brand-400 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 hover:text-white text-sm font-semibold transition"
          >
            {NavIcon.marketplace} Projects
          </Link>

          {user ? (
            <>
              <NotificationBell />
              <Link to="/profile" className="flex-shrink-0">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username || "U")}&background=5b54a4&color=fff`}
                  alt="Profile"
                  className="w-9 h-9 rounded-full border-2 border-brand-500 object-cover hover:scale-105 transition"
                />
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2.5">
          {user && (
            <Link
              to="/my-communities"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-brand-500/40 bg-brand-500/10 text-brand-300 text-xs font-semibold transition flex-shrink-0"
            >
              {NavIcon.communities} <span className="hidden xs:inline">Communities</span>
            </Link>
          )}
          {user && (
            <Link
              to="/friends"
              className="relative inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-brand-500/40 bg-brand-500/10 text-brand-300 text-xs font-semibold transition flex-shrink-0"
            >
              {NavIcon.friends} <span className="hidden xs:inline">Friends</span>
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </Link>
          )}
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-brand-500/40 bg-brand-500/10 text-brand-300 text-xs font-semibold transition flex-shrink-0"
          >
            {NavIcon.marketplace} <span className="hidden xs:inline">Buy</span>
          </Link>
          {user && <NotificationBell />}
          <button
            onClick={() => setOpen(!open)}
            className="text-white text-2xl leading-none flex-shrink-0"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-navy-900/95 px-4 pb-4 flex flex-col gap-4 text-gray-400 text-sm border-b border-white/10">
          {onAboutClick && (
            <button
              onClick={() => { onAboutClick(); setOpen(false); }}
              className="text-left hover:text-white"
            >
              About NexOrbite
            </button>
          )}

          {user ? (
            <>
              <Link to="/my-communities" onClick={() => setOpen(false)} className="text-brand-500 font-semibold">My Communities</Link>
              <Link to="/friends" onClick={() => setOpen(false)} className="text-brand-500 font-semibold">Friends {pendingCount > 0 && `(${pendingCount})`}</Link>
              <Link to="/profile" onClick={() => setOpen(false)} className="text-brand-500 font-semibold">My Profile</Link>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="bg-brand-600 text-white text-center py-2 rounded-full">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}