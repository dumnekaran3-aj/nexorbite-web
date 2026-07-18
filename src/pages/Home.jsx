import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import Navbar from "../components/layout/Navbar";
import { Copy, Check, Users2, Building2, ShoppingBag, Eye, Flame } from "lucide-react";

// ─── Shared Image Enlarge Modal ────────────────────────────────────────────────
function ImageEnlargeModal({ src, name, onClose, rounded = true }) {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-navy-900/85 backdrop-blur-sm p-4" onClick={onClose}>
      <img
        src={src}
        alt={name}
        className={`max-w-[90vw] max-h-[85vh] object-contain border-4 border-brand-500 shadow-2xl ${rounded ? "rounded-full w-72 h-72 object-cover" : "rounded-2xl"}`}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl transition"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Download Alert Modal ─────────────────────────────────────────────────────
function DownloadModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-5xl mb-4">🚀</div>
        <h3 className="text-xl font-extrabold mb-2">Coming Soon!</h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          NexOrbite mobile app for <span className="text-green-400 font-semibold">Android</span> &amp; <span className="text-blue-400 font-semibold">iOS</span> is under development.<br />
          Stay tuned — we're launching very soon! 🎉
        </p>
        <button onClick={onClose} className="w-full py-3 bg-brand-600 hover:bg-brand-500 rounded-2xl text-sm font-bold transition">
          Got it!
        </button>
      </div>
    </div>
  );
}

// ─── About Modal ──────────────────────────────────────────────────────────────
function AboutModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">About <span className="text-white">Nex</span><span className="text-brand-400">Orbite</span></h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition">✕</button>
        </div>
        <div className="px-6 py-5 border-b border-white/10">
          <h3 className="text-lg font-bold mb-1">Everything in One Place</h3>
          <p className="text-gray-400 text-sm mb-5">Built for students, by students</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: "🏫", title: "Campus Community",  desc: "Join your college via invite code. Private, verified, real." },
              { icon: "🛒", title: "Skill Marketplace", desc: "Sell CAD files, code, PCB layouts, notes and more." },
              { icon: "💬", title: "Real-time Chat",    desc: "1-on-1 and group chat with your college community." },
              { icon: "🤝", title: "Collaborate",       desc: "Find skilled students across branches for projects." },
              { icon: "💰", title: "Earn Money",        desc: "Monetize your skills while still in college." },
              { icon: "🔐", title: "Role Management",   desc: "Owner, Principal, HOD, Teacher, Student — full control." },
            ].map((f) => (
              <div key={f.title} className="flex gap-3 bg-white/[0.03] border border-white/8 rounded-2xl p-3">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-5">
          <h3 className="text-lg font-bold mb-1">How It Works</h3>
          <p className="text-gray-400 text-sm mb-4">3 simple steps to get started</p>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { step: "01", title: "Download App",      desc: "Get NexOrbite from Play Store." },
              { step: "02", title: "Join Your College", desc: "Use invite code to join your campus." },
              { step: "03", title: "Build & Earn",      desc: "Share projects, sell products, collaborate." },
            ].map((s) => (
              <div key={s.step} className="flex-1 text-center bg-white/[0.03] border border-white/8 rounded-2xl p-4">
                <p className="text-3xl font-extrabold text-brand-500/30 mb-1">{s.step}</p>
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-gray-500 text-xs mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-3 bg-brand-600 hover:bg-brand-500 rounded-2xl text-sm font-bold transition">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Trending Community Circle (with logo + click-to-enlarge) ────────────────
function CommunityCircle({ c, onClick, onEnlarge }) {
  const [imgError, setImgError] = useState(false);
  const letter = c.college_name?.[0]?.toUpperCase() || "C";
  const hasLogo = !!c.logo_url && !imgError;

  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0 group">
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (hasLogo) onEnlarge(c.logo_url, c.college_name);
            else onClick();
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-900 border-2 border-brand-500/40 group-hover:border-brand-400 transition overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105"
        >
          {hasLogo ? (
            <img src={c.logo_url} alt={c.college_name} className="w-full h-full object-cover" loading="lazy" onError={() => setImgError(true)} />
          ) : (
            <span className="text-xl font-extrabold text-white">{letter}</span>
          )}
        </button>
        <span className="absolute -bottom-1 -right-1 bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-navy-900 leading-tight pointer-events-none">
          {c.usageCount > 999 ? `${Math.floor(c.usageCount / 1000)}k` : c.usageCount || 0}
        </span>
      </div>
      <button type="button" onClick={onClick} className="text-[10px] text-gray-400 group-hover:text-white transition text-center max-w-[60px] leading-tight truncate">
        {c.college_name?.split(" ")[0] || "College"}
      </button>
    </div>
  );
}

// ─── Copy-to-clipboard helper — falls back to execCommand when
// navigator.clipboard is unavailable (older browsers / plain-http dev),
// so a click can never throw an uncaught error. ───────────────────────────────
function copyText(text) {
  if (!text) return Promise.resolve(false);
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => copyFallback(text));
  }
  return Promise.resolve(copyFallback(text));
}
function copyFallback(text) {
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

// ─── Community Card ────────────────────────────────────────────────────────
// Own component (not inline JSX in a .map) so each card owns its own
// image-error / copy state independently — one broken banner or logo can
// never break the rest of the grid, and rendering 3 or 300 cards costs the
// same per-card logic (scalable).
function CommunityCard({ c, isMember, onOpen, onEnlarge }) {
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  const hasBanner = !!c.banner_url && !bannerError;
  const hasLogo = !!c.logo_url && !logoError;

  const handleCopyInvite = async (e) => {
    e.stopPropagation();
    if (!c.invite_code) return;
    const ok = await copyText(c.invite_code);
    if (ok) {
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    }
  };

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  return (
    <div
      className="relative bg-navy-900 border border-white/10 hover:border-brand-500/50 rounded-2xl overflow-hidden cursor-pointer transition group"
      onClick={onOpen}
    >
      {/* Banner strip — shows the community's own banner image. The soft
          blue gradient is only a fallback while it loads, if none is set,
          or if the image URL 404s — it never leaves a blank/broken box. */}
      <div
        className="h-16 relative overflow-hidden bg-gradient-to-r from-brand-900/50 to-brand-700/30"
        onClick={(e) => { if (hasBanner) { e.stopPropagation(); onEnlarge(c.banner_url, `${c.college_name} banner`); } }}
      >
        {hasBanner && (
          <img
            src={c.banner_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover hover:opacity-85 transition"
            loading="lazy"
            onError={() => setBannerError(true)}
          />
        )}
      </div>

      <div className="p-5 -mt-6 relative">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={(e) => { if (hasLogo) { e.stopPropagation(); onEnlarge(c.logo_url, c.college_name); } }}
            className="w-12 h-12 rounded-xl bg-brand-600 border-2 border-navy-900 flex items-center justify-center text-lg font-extrabold flex-shrink-0 group-hover:scale-110 transition overflow-hidden"
          >
            {hasLogo
              ? <img src={c.logo_url} alt={c.college_name} className="w-full h-full object-cover" loading="lazy" onError={() => setLogoError(true)} />
              : c.college_name?.[0]?.toUpperCase() || "C"}
          </button>
          <div className="flex-1 min-w-0 pt-2">
            <h3 className="font-bold text-sm truncate">{c.college_name || "Unnamed College"}</h3>
            <p className="text-gray-500 text-xs truncate">{c.university || " "}</p>
          </div>
          <span className={`text-[10px] px-2 py-1 rounded-full font-semibold flex-shrink-0 ${isMember ? "bg-green-500/20 text-green-400" : "bg-white/5 text-gray-400"}`}>
            {isMember ? "Enter →" : "Join"}
          </span>
        </div>

        <p className="text-gray-500 text-xs line-clamp-2 mb-3 min-h-[2rem]">{c.description || "No description yet."}</p>

        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="inline-flex items-center gap-1"><Users2 size={12} /> {c.usageCount || 0} members</span>
          {c.category && <span className="px-2 py-0.5 rounded-full bg-white/5">{c.category}</span>}
        </div>
      </div>

      {/* Invite code — bottom-right corner, click to copy. Only renders
          when the backend actually sends a code, so it never shows an
          empty/broken chip. */}
      {c.invite_code && (
        <button
          type="button"
          onClick={handleCopyInvite}
          title="Copy invite code"
          className={`absolute bottom-3 right-3 inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-1 rounded-full border backdrop-blur-sm transition ${
            copied
              ? "bg-green-600/25 border-green-500/40 text-green-300"
              : "bg-navy-900/80 border-white/15 text-gray-300 hover:text-white hover:border-brand-500/50"
          }`}
        >
          {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> {c.invite_code}</>}
        </button>
      )}
    </div>
  );
}

// ─── Product Card (with college logo + click-to-enlarge) ─────────────────────
function ProductCard({ p, onEnlargeLogo, onOpen }) {
  const [imgError, setImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  return (
    <div
      onClick={onOpen}
      className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden hover:border-brand-500/50 transition-all group flex-shrink-0 w-64 sm:w-auto cursor-pointer"
    >
      <div className="relative h-40 bg-white/5 overflow-hidden">
        {p.thumbnailUrl && !imgError ? (
          <img
            src={p.thumbnailUrl}
            alt={p.title || "Product"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-brand-900/20">📦</div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${p.isPaid ? "bg-brand-600 text-white" : "bg-green-600 text-white"}`}>
            {p.isPaid ? `₹${p.price || 0}` : "Free"}
          </span>
        </div>
        {p.isTrending && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-orange-500/90 text-white"><Flame size={10} /> Trending</span>
          </div>
        )}
      </div>
      <div className="p-4">
        {p.branch && <span className="text-brand-400 text-[10px] font-bold uppercase tracking-widest">{p.branch}</span>}
        <h3 className="text-white font-semibold text-sm mt-1 mb-1 line-clamp-2 leading-tight">{p.title || "Untitled Product"}</h3>
        {p.description && <p className="text-gray-500 text-xs line-clamp-2 mb-3">{p.description}</p>}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <span className="inline-flex items-center gap-1"><ShoppingBag size={12} /> {p.salesCount || 0} sold</span>
          <span className="inline-flex items-center gap-1"><Eye size={12} /> {p.viewCount || 0} views</span>
        </div>

        {p.college?.name && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (p.college.logo && !logoError) onEnlargeLogo(p.college.logo, p.college.name);
              }}
              className="w-5 h-5 rounded-full bg-brand-600/40 flex items-center justify-center overflow-hidden flex-shrink-0 hover:scale-110 transition"
            >
              {p.college.logo && !logoError ? (
                <img src={p.college.logo} alt={p.college.name} className="w-full h-full object-cover" onError={() => setLogoError(true)} />
              ) : (
                <span className="text-[8px] font-bold text-brand-300">{p.college.name[0]?.toUpperCase()}</span>
              )}
            </button>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 truncate">{p.college.name}</p>
              {p.college.university && <p className="text-[9px] text-gray-700 truncate">{p.college.university}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN HOME ────────────────────────────────────────────────────────────────
export default function Home() {
  const { user, loading: authLoading, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [products,    setProducts]    = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [inviteCode,  setInviteCode]  = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showDownload, setShowDownload] = useState(false);
  const [showAbout,    setShowAbout]   = useState(false);
  const [enlargeImg,   setEnlargeImg]  = useState(null); // { src, name }

  useEffect(() => {
    if (!user) refreshUser();
  }, []); // eslint-disable-line

  // FIX: was reading user?.branch (field doesn't exist — profile returns
  // `stream`), so the branch filter silently never applied. Also now re-runs
  // once the async user profile finishes loading, and hard-filters to the
  // user's branch (top 10-20) instead of mixing all branches together.
  //
  // REMOVED: the /api/home/stats call — the Students/Communities/Branches
  // counter row was taken off the page, so that request was pure dead
  // weight on every home-page load. One less network round trip now.
  useEffect(() => {
    if (authLoading) return; // wait for AuthContext to resolve user first

    let isMounted = true;
    const fetchData = async () => {
      try {
        const branchQuery = user?.stream ? `&branch=${encodeURIComponent(user.stream)}` : "";
        const [productsRes, communitiesRes] = await Promise.all([
          api.get(`/api/home/trending-products?limit=12${branchQuery}`),
          api.get("/api/home/trending-communities"),
        ]);
        if (!isMounted) return;
        setProducts(productsRes.data.data || []);
        setCommunities(communitiesRes.data.data || []);
      } catch (err) {
        console.error("Home fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [authLoading, user?.stream]);

  const joinCommunity = async () => {
    try {
      await api.post("/api/createcollege/join", { invite_code: inviteCode });
      await refreshUser();
      setShowModal(false);
      navigate(`/community/${selectedCommunity._id}`);
    } catch (err) {
      if (err.response?.status === 400) {
        setShowModal(false);
        navigate(`/community/${selectedCommunity._id}`);
      } else {
        alert(err.response?.data?.msg || "Something went wrong");
      }
    }
  };

  const topCommunities = communities.slice(0, 10);
  const openEnlarge = (src, name) => setEnlargeImg({ src, name });

  const handleCommunityOpen = (c) => {
    const isMember = user?.collegeId && String(user.collegeId) === String(c._id);
    if (isMember) navigate(`/community/${c._id}`);
    else { setSelectedCommunity(c); setShowModal(true); }
  };

  return (
    <div className="bg-navy-900 text-white min-h-screen">

      {showDownload && <DownloadModal onClose={() => setShowDownload(false)} />}
      {showAbout    && <AboutModal   onClose={() => setShowAbout(false)} />}
      {enlargeImg   && <ImageEnlargeModal src={enlargeImg.src} name={enlargeImg.name} onClose={() => setEnlargeImg(null)} />}

      {/* ── NAVBAR (shared component — same across all pages, includes NotificationBell) ── */}
      <Navbar onAboutClick={() => setShowAbout(true)} />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-28 pb-10 min-h-[85vh]">
        <span className="text-brand-400 text-xs font-bold tracking-[0.25em] uppercase mb-5 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10">
         Make Your Network , Collabrate Each Other
        </span>

        {!loading && topCommunities.length > 0 && (
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 overflow-x-auto pb-2 max-w-full px-2">
            {topCommunities.map((c) => (
              <CommunityCircle
                key={c._id}
                c={c}
                onEnlarge={openEnlarge}
                onClick={() => handleCommunityOpen(c)}
              />
            ))}
          </div>
        )}
        {loading && (
          <div className="flex gap-3 mb-8">
            {[...Array(6)].map((_, i) => <div key={i} className="w-14 h-14 rounded-full bg-white/5 animate-pulse" />)}
          </div>
        )}

        <h1 className="text-4xl md:text-7xl font-extrabold leading-tight mb-5">
          Build. Sell. <br />
          <span className="text-brand-500">Collaborate.</span>
        </h1>
        <p className="text-gray-400 text-base md:text-xl max-w-2xl mb-8">
          NexOrbite connects students across colleges — share projects, sell digital products, and grow your campus network.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setShowDownload(true)} className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-4 rounded-full text-base transition">
            📱 Download App
          </button>
          <button onClick={() => setShowAbout(true)} className="border border-white/20 hover:border-brand-500 text-white font-semibold px-8 py-4 rounded-full text-base transition">
            Learn More
          </button>
        </div>
      </section>

      {/* ── TRENDING PRODUCTS (user's own branch only, top 12) ─────────────────── */}
      <section id="marketplace" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold">
                {user?.stream ? `Trending in ${user.stream}` : "Trending Products"}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {user?.stream ? "Top picks from your branch" : "Top selling student work right now"}
              </p>
            </div>
            <Link to="/marketplace" className="text-brand-400 hover:text-brand-300 text-xs font-semibold transition flex-shrink-0">
              See all branches →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-white/[0.03] border border-white/8 rounded-2xl animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🛒</div>
              <p className="text-gray-500">No products yet — be the first to sell!</p>
            </div>
          ) : (
            <>
              <div className="flex gap-4 overflow-x-auto pb-3 sm:hidden scrollbar-none">
                {products.map((p) => (
                  <ProductCard key={p._id} p={p} onEnlargeLogo={openEnlarge} onOpen={() => navigate(`/marketplace/${p._id}`)} />
                ))}
              </div>
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((p) => (
                  <ProductCard key={p._id} p={p} onEnlargeLogo={openEnlarge} onOpen={() => navigate(`/marketplace/${p._id}`)} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── ACTIVE COMMUNITIES (with logo + banner + copyable invite code) ────── */}
      <section id="community" className="py-16 px-4 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold">Active Communities</h2>
              <p className="text-gray-500 text-sm mt-1">Join your college on NexOrbite</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-44 bg-white/[0.03] border border-white/8 rounded-2xl animate-pulse" />)}
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center py-20">
              <div className="flex items-center justify-center mb-4 text-brand-400"><Building2 size={44} /></div>
              <p className="text-gray-500">No communities yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {communities.map((c) => (
                <CommunityCard
                  key={c._id}
                  c={c}
                  isMember={!!(user?.collegeId && String(user.collegeId) === String(c._id))}
                  onOpen={() => handleCommunityOpen(c)}
                  onEnlarge={openEnlarge}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── DOWNLOAD CTA ────────────────────────────────────────────────────── */}
      <section id="download" className="py-24 px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
          Ready to <span className="text-brand-500">Join?</span>
        </h2>
        <p className="text-gray-400 text-base mb-8 max-w-lg mx-auto">
          Download NexOrbite and become part of India's fastest growing student ecosystem.
        </p>
        <button onClick={() => setShowDownload(true)} className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-10 py-4 rounded-full text-lg transition">
          📱 Download NexOrbite
        </button>
      </section>

      {/* ── JOIN MODAL ───────────────────────────────────────────────────────── */}
      {showModal && selectedCommunity && (
        <div className="fixed inset-0 bg-navy-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => selectedCommunity.logo_url && openEnlarge(selectedCommunity.logo_url, selectedCommunity.college_name)}
                className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-extrabold text-lg overflow-hidden flex-shrink-0"
              >
                {selectedCommunity.logo_url
                  ? <img src={selectedCommunity.logo_url} alt="" className="w-full h-full object-cover" />
                  : selectedCommunity.college_name?.[0]?.toUpperCase()}
              </button>
              <div>
                <h3 className="font-bold text-sm">{selectedCommunity.college_name}</h3>
                <p className="text-gray-500 text-xs">{selectedCommunity.university}</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-4">Enter the invite code shared by your college admin.</p>
            <input
              className="w-full p-3 mb-4 bg-navy-900 border border-white/20 rounded-xl text-white outline-none uppercase tracking-[0.2em] text-center font-mono text-lg focus:border-brand-500 transition"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="INVITE CODE"
              maxLength={12}
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowModal(false); setInviteCode(""); }} className="flex-1 px-4 py-2.5 text-gray-400 border border-white/10 rounded-xl text-sm font-semibold hover:text-white transition">
                Cancel
              </button>
              <button onClick={joinCommunity} disabled={!inviteCode.trim()} className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 rounded-xl text-white text-sm font-bold transition">
                Join →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}