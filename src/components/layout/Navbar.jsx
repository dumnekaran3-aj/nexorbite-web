// src/components/layout/Navbar.jsx
//
// FIX (redesign): "classic" Facebook-jaisa pattern —
//  - Navbar height badhayi (h-24, pehle ek chhota py-4 row tha)
//  - "NexOrbite" naam ab upar-left, thoda bada aur upar-aligned baitha hai
//  - Har nav button ab ICON + LABEL (hamesha visible, niche chhota text) —
//    pehle sirf icon+inline-text ek row me tha, "pill" button jaisa
//  - Naya "Discover" tab add hua (premium feature) — globe icon, agar user
//    premium nahi hai to ek chhota lock-badge dikhta hai (feature abhi bhi
//    tappable hai — click karne par upgrade-prompt milega, hide nahi kiya,
//    taaki discovery/conversion bana rahe)
import { useState, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import NotificationBell from "../NotificationBell";
import api from "../../lib/api";

// ─── Official line-icons (no emoji) — ek-nazar me samajh aaye button kya karta hai ──
const NavIcon = {
  communities: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 21V9l9-6 9 6v12" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  marketplace: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  friends: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  // 🆕 Discover — globe/network icon: "duniya bhar me match dhoondo"
  discover: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3H9Z"/></svg>
  ),
};

// ─── One nav tab: icon on top, label always visible below (Facebook-app style) ──
function NavTab({ to, icon, label, active, badge, locked, compact }) {
  return (
    <Link
      to={to}
      className={`relative flex flex-col items-center justify-center gap-1 rounded-xl transition flex-shrink-0
        ${compact ? "px-2.5 py-1.5 min-w-[56px]" : "px-4 py-2 min-w-[68px]"}
        ${active ? "text-brand-400 bg-brand-500/10" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
    >
      <span className="relative">
        {icon}
        {locked && (
          <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-yellow-500 text-navy-950 rounded-full flex items-center justify-center">
            {NavIcon.lock}
          </span>
        )}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className={`font-semibold leading-none ${compact ? "text-[9px]" : "text-[10px]"} ${active ? "text-brand-400" : ""}`}>
        {label}
      </span>
      {active && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-brand-500" />}
    </Link>
  );
}

export default function Navbar({ onAboutClick }) {
  const [open, setOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [isPremium, setIsPremium] = useState(true); // 🆕 BETA: Discover free for everyone right now

  // Friend-request badge
  useEffect(() => {
    if (!user) { setPendingCount(0); return; }
    let cancelled = false;
    api.get("/api/ecosystem/friends/requests/incoming")
      .then((res) => { if (!cancelled) setPendingCount(res.data?.count || 0); })
      .catch(() => { if (!cancelled) setPendingCount(0); });
    return () => { cancelled = true; };
  }, [user]);

  // 🆕 BETA: Discover abhi premium-gated nahi hai, isliye ye fetch fully
  // disabled hai (isPremium hamesha true rehta hai upar). Premium tier
  // launch hone par bas is poore block ko uncomment kar dena — kahin aur
  // kuch change nahi karna padega.
  //
  // useEffect(() => {
  //   if (!user) { setIsPremium(false); return; }
  //   let cancelled = false;
  //   api.get("/api/profile/me")
  //     .then((res) => { if (!cancelled) setIsPremium(!!res.data?.profile?.isPremium); })
  //     .catch(() => { if (!cancelled) setIsPremium(false); });
  //   return () => { cancelled = true; };
  // }, [user]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav className="fixed top-0 w-full z-50 bg-navy-900/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between gap-4">

        {/* Logo — ab upar-aligned aur bada, jaisa Facebook ka wordmark */}
        <Link to="/" className="flex-shrink-0 self-start pt-4">
          <span className="text-white font-extrabold text-2xl sm:text-3xl tracking-tight leading-none">
            Nex<span className="text-brand-500">Orbite</span>
          </span>
        </Link>

        {/* Desktop — center icon+label nav tabs (classic pattern) */}
        {user && (
          <div className="hidden md:flex items-center gap-1">
            <NavTab to="/my-communities" icon={NavIcon.communities} label="Communities" active={isActive("/my-communities")} />
            <NavTab to="/friends" icon={NavIcon.friends} label="Friends" active={isActive("/friends")} badge={pendingCount} />
            <NavTab to="/marketplace" icon={NavIcon.marketplace} label="Marketplace" active={isActive("/marketplace")} />
            <NavTab to="/discover" icon={NavIcon.discover} label="Discover" active={isActive("/discover")} locked={!isPremium} />
          </div>
        )}

        {!user && onAboutClick && (
          <button onClick={onAboutClick} className="hidden md:block text-sm text-gray-400 hover:text-white transition">
            About NexOrbite
          </button>
        )}

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {user ? (
            <>
              <NotificationBell />
              <Link to="/profile" className="flex-shrink-0">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username || "U")}&background=5b54a4&color=fff`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-brand-500 object-cover hover:scale-105 transition"
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

        {/* Mobile — same icon+label pattern, horizontal scroll, labels ALWAYS visible */}
        <div className="md:hidden flex items-center gap-1 flex-1 min-w-0 justify-end">
          {/* 🔴 FIX: nav tabs ka horizontal-scroll row ab ALAG hai — pehle
              NotificationBell isी overflow-x-auto div ke andar tha. CSS rule:
              jab overflow-x kuch bhi ho (visible ke alawa) aur overflow-y
              set na ho, browser overflow-y ko bhi automatically "auto" bana
              deta hai — isse bell ka dropdown panel (position: absolute,
              neeche extend karta hai) silently clip ho jaata tha. Tap karne
              par state to badalta tha, par panel kabhi dikhta hi nahi tha. */}
          {user && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0">
              <NavTab to="/my-communities" icon={NavIcon.communities} label="Groups" active={isActive("/my-communities")} compact />
              <NavTab to="/friends" icon={NavIcon.friends} label="Friends" active={isActive("/friends")} badge={pendingCount} compact />
              <NavTab to="/marketplace" icon={NavIcon.marketplace} label="Market" active={isActive("/marketplace")} compact />
              <NavTab to="/discover" icon={NavIcon.discover} label="Discover" active={isActive("/discover")} locked={!isPremium} compact />
            </div>
          )}
          {user && (
            <div className="flex-shrink-0">
              <NotificationBell />
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="text-white text-2xl leading-none flex-shrink-0 px-1"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown — profile link + about + sign in */}
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
            <Link to="/profile" onClick={() => setOpen(false)} className="text-brand-500 font-semibold">My Profile</Link>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="bg-brand-600 text-white text-center py-2 rounded-full">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}