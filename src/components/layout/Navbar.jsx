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
//
// 🔴 FIX (mobile scroll): pehle mobile pe nav-tabs logo ke saath USI row me
//  the aur `overflow-x-auto` ke through horizontal-scroll karte the (jaisa
//  screenshot me dikha — thumb-scrollbar niche tha). Ab mobile ke liye ek
//  ALAG dusri row hai, poori width leti hai, aur 4 tabs `flex-1` se barabar
//  space le lete hain — koi scroll nahi, sab kuch ek nazar me dikhta hai.
import { useState, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import NotificationBell from "../NotificationBell";
import api from "../../lib/api";

// ─── Official line-icons (no emoji) — ek-nazar me samajh aaye button kya karta hai ──
const NavIcon = {
  communities: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="8" r="2.3" />
      <path d="M2 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
      <path d="M17 15.3a4 4 0 0 1 4 4V21" />
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
// `compact` = mobile mode. Ab compact mode me `flex-1` diya hai (fixed
// min-width ki jagah) taaki 4 tabs poori row-width ko barabar baant lein
// aur horizontal scroll ki zaroorat na pade.
// 🆕 `iconOnly` — Home page pe scroll karte waqt row2 (label wali row) hide
// ho jaati hai aur ye ultra-compact icon-only tabs row1 ke andar hi dikhti
// hain (jagah bachane ke liye). Baaki sab pages iska use nahi karte.
function NavTab({ to, icon, label, active, badge, locked, compact, iconOnly }) {
  return (
    <Link
      to={to}
      className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl transition
        ${iconOnly ? "flex-1 py-1.5 min-w-0" : compact ? "flex-1 py-0.5 min-w-0" : "flex-shrink-0 px-4 py-2 min-w-[68px]"}
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
      {!iconOnly && (
        <span className={`font-semibold leading-none truncate max-w-full ${compact ? "text-[9px]" : "text-[10px]"} ${active ? "text-brand-400" : ""}`}>
          {label}
        </span>
      )}
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

  // 🆕 FIX (content hiding behind navbar + wasted space request):
  // Sirf HOME page pe, jab user thoda scroll kare, navbar apne aap ek
  // chhota single-row "compact" bar me simat jaata hai — "NexOrbite" naam
  // ki jagah sirf logo icon dikhta hai aur neeche wali tabs-row usi row
  // me icon-only ban jaati hai. Baaki SAARE pages (friends/marketplace/
  // community/etc.) is se bilkul unaffected hain — unka navbar hamesha
  // apni normal height par hi rehta hai jaisa pehle tha.
  const isHome = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const compact = isHome && scrolled;

  useEffect(() => {
    if (!isHome) { setScrolled(false); return; }
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 28);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

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
      <div className="max-w-7xl mx-auto px-4">
        {/* ── Row 1: logo + desktop tabs/actions + mobile bell/hamburger ── */}
        {/* 🔧 Mobile height thoda tight kiya (h-14→h-12) taaki navbar overall
            kam jagah le aur "NexOrbite" naam ke niche wali tabs-row se gap
            bhi kam mehsoos ho. Desktop bilkul waisa hi hai (h-24). */}
        <div className={`flex items-center justify-between gap-4 transition-[height] duration-150 ${compact ? "h-12" : "h-12 sm:h-14"} md:h-24`}>

          {/* Logo — normal state me poora wordmark. Sirf Home page pe scroll
              karne par (mobile only) ye ek chhote logo-icon me badal jaata
              hai — jagah bachane ke liye. Desktop pe hamesha wordmark hi. */}
          <Link to="/" className="flex-shrink-0 md:self-start md:pt-4 flex items-center">
            {compact && (
              <img
                src="/icons/icon-512x512.png"
                alt="NexOrbite"
                className="md:hidden w-8 h-8 rounded-lg object-cover"
              />
            )}
            <span className={`text-white font-extrabold text-xl sm:text-3xl tracking-tight leading-none ${compact ? "hidden md:inline" : ""}`}>
              Nex<span className="text-brand-500">Orbite</span>
            </span>
          </Link>

          {/* 🆕 Compact inline tabs — sirf Home page scroll ke waqt (mobile),
              logo ke turant baad, icon-only. Row2 (label-wali row) isi waqt
              hide ho jaati hai (niche dekho), toh total height bahut kam
              lagti hai aur feed padhne ke liye zyada screen milti hai. */}
          {user && compact && (
            <div className="md:hidden flex items-stretch flex-1 justify-end gap-0.5 min-w-0">
              <NavTab to="/my-communities" icon={NavIcon.communities} active={isActive("/my-communities")} iconOnly />
              <NavTab to="/friends" icon={NavIcon.friends} active={isActive("/friends")} badge={pendingCount} iconOnly />
              <NavTab to="/marketplace" icon={NavIcon.marketplace} active={isActive("/marketplace")} iconOnly />
              <NavTab to="/discover" icon={NavIcon.discover} active={isActive("/discover")} locked={!isPremium} iconOnly />
            </div>
          )}

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

          {/* Right side — desktop */}
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

          {/* Right side — mobile: sirf bell + hamburger, tabs ab neeche apni row me hain */}
          <div className="md:hidden flex items-center gap-2 flex-shrink-0">
            {user ? (
              <NotificationBell />
            ) : (
              onAboutClick && (
                <button onClick={onAboutClick} className="text-xs text-gray-400 hover:text-white transition">
                  About
                </button>
              )
            )}
            <button
              onClick={() => setOpen(!open)}
              className="text-white text-2xl leading-none px-1"
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* ── Row 2 (mobile only): nav tabs, full width, no scroll ── */}
        {/* 🔧 iske aur upar wali row ke beech ka extra space nikal diya
            (pb-1 se pb-0.5, aur NavTab ka apna py bhi tight kiya) — ab
            "NexOrbite" aur tabs ke beech khaali jagah kam dikhegi.
            Ye row Home page pe compact mode me poori tarah hide ho jaati
            hai (row1 ke andar hi icon-only tabs aa jaati hain upar). */}
        {user && !compact && (
          <div className="md:hidden flex items-stretch gap-0.5 pb-0.5">
            <NavTab to="/my-communities" icon={NavIcon.communities} label="Communities" active={isActive("/my-communities")} compact />
            <NavTab to="/friends" icon={NavIcon.friends} label="Friends" active={isActive("/friends")} badge={pendingCount} compact />
            <NavTab to="/marketplace" icon={NavIcon.marketplace} label="Market" active={isActive("/marketplace")} compact />
            <NavTab to="/discover" icon={NavIcon.discover} label="Discover" active={isActive("/discover")} locked={!isPremium} compact />
          </div>
        )}
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