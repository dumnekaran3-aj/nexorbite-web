import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import Navbar from "../components/layout/Navbar";
import {
  Copy, Check, Users2, Building2, ShoppingBag, Eye, Flame,
  GraduationCap, ArrowUpRight, ImageOff,
} from "lucide-react";

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

// ─── Copy-to-clipboard helper ─────────────────────────────────────────────────
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

// ─── Feed-style Product Post ────────────────────────────────────────────────
// Instagram/Bluesky jaisa single-column feed post — cards nahi, ek continuous
// scroll feed. Own component so one broken image/college-logo never breaks
// the rest of the feed (isolated error state per post).
function ProductFeedPost({ p, onOpen, onEnlargeLogo }) {
  const [imgError, setImgError]   = useState(false);
  const [logoError, setLogoError] = useState(false);

  const hasImage = !!p.thumbnailUrl && !imgError;
  const hasLogo  = !!p.college?.logo && !logoError;

  return (
    <article className="border-b border-white/8 py-5 first:pt-0 last:border-b-0">
      {/* Header — college identity, like an author row on a social feed */}
      <div className="flex items-center gap-3 px-1 mb-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (hasLogo) onEnlargeLogo(p.college.logo, p.college.name);
          }}
          className="w-9 h-9 rounded-full bg-brand-600/30 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10"
        >
          {hasLogo ? (
            <img src={p.college.logo} alt={p.college.name} className="w-full h-full object-cover" onError={() => setLogoError(true)} />
          ) : (
            <GraduationCap size={16} className="text-brand-300" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{p.college?.name || "Independent Seller"}</p>
          <p className="text-xs text-gray-500 truncate">{p.college?.university || (p.branch ? p.branch : "")}</p>
        </div>
        {p.isTrending && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25 flex-shrink-0">
            <Flame size={11} /> Trending
          </span>
        )}
      </div>

      {/* Media — clickable, opens product page */}
      <button
        type="button"
        onClick={onOpen}
        className="block w-full rounded-2xl overflow-hidden bg-white/[0.03] border border-white/8 mb-3"
      >
        {hasImage ? (
          <img
            src={p.thumbnailUrl}
            alt={p.title || "Product"}
            className="w-full max-h-[480px] object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full aspect-[16/10] flex flex-col items-center justify-center gap-2 text-gray-600">
            <ImageOff size={28} />
            <span className="text-xs">No preview available</span>
          </div>
        )}
      </button>

      {/* Caption */}
      <div className="px-1">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-semibold text-[15px] leading-snug">{p.title || "Untitled Product"}</h3>
          <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${p.isPaid ? "bg-brand-600/20 text-brand-300" : "bg-green-600/20 text-green-400"}`}>
            {p.isPaid ? `₹${p.price || 0}` : "Free"}
          </span>
        </div>
        {p.description && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">{p.description}</p>
        )}

        {/* Engagement row — like/comment-row equivalent, but with real stats */}
        <div className="flex items-center gap-5 text-gray-500 text-xs">
          <span className="inline-flex items-center gap-1.5"><Eye size={15} /> {p.viewCount || 0}</span>
          <span className="inline-flex items-center gap-1.5"><ShoppingBag size={15} /> {p.salesCount || 0} sold</span>
          {p.branch && <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-semibold uppercase tracking-wide">{p.branch}</span>}
          <button
            type="button"
            onClick={onOpen}
            className="ml-auto inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-semibold transition"
          >
            View <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Feed skeleton — loading state, matches feed shape (no layout jump) ─────
function FeedSkeleton() {
  return (
    <div className="max-w-xl mx-auto">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border-b border-white/8 py-5 first:pt-0 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white/5" />
            <div className="flex-1">
              <div className="h-3 w-28 bg-white/5 rounded mb-2" />
              <div className="h-2.5 w-20 bg-white/5 rounded" />
            </div>
          </div>
          <div className="w-full aspect-[16/10] rounded-2xl bg-white/[0.03]" />
          <div className="h-3 w-3/4 bg-white/5 rounded mt-3" />
          <div className="h-2.5 w-1/2 bg-white/5 rounded mt-2" />
        </div>
      ))}
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
  const [enlargeImg,   setEnlargeImg]  = useState(null);

  useEffect(() => {
    if (!user) refreshUser();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (authLoading) return;

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
        // Crash-free: request fail ho to bhi page kaam kare, sections empty-state dikhayenge
        if (isMounted) { setProducts([]); setCommunities([]); }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [authLoading, user?.stream]);

  const joinCommunity = async () => {
    try {
      const res = await api.post("/api/createcollege/join", {
        invite_code: inviteCode,
        collegeId: selectedCommunity._id,
      });
      await refreshUser();
      setShowModal(false);
      const joinedId = res.data?.college?._id || selectedCommunity._id;
      navigate(`/community/${joinedId}`);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.msg === "Already a member of this community") {
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

      {/* ── TRENDING PRODUCTS — Instagram/Bluesky style vertical feed ─────────── */}
      <section id="marketplace" className="py-16 px-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold">
                {user?.stream ? `Trending in ${user.stream}` : "Trending Products"}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {user?.stream ? "Top picks from your branch" : "Top selling student work right now"}
              </p>
            </div>
            <Link to="/marketplace" className="text-brand-400 hover:text-brand-300 text-xs font-semibold transition flex-shrink-0">
              See all →
            </Link>
          </div>

          {loading ? (
            <FeedSkeleton />
          ) : products.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <div className="flex items-center justify-center mb-4 text-brand-400/60"><ShoppingBag size={40} /></div>
              <p className="text-gray-500 text-sm">No products yet — be the first to sell!</p>
            </div>
          ) : (
            <div>
              {products.map((p) => (
                <ProductFeedPost
                  key={p._id}
                  p={p}
                  onOpen={() => navigate(`/marketplace/${p._id}`)}
                  onEnlargeLogo={openEnlarge}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ACTIVE COMMUNITIES ────────────────────────────────────────────────── */}
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