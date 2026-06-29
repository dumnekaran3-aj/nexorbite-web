import { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

// ─── Download Alert Modal ─────────────────────────────────────────────────────
function DownloadModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-5xl mb-4">🚀</div>
        <h3 className="text-xl font-extrabold mb-2">Coming Soon!</h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          NexOrbite mobile app for <span className="text-green-400 font-semibold">Android</span> &amp; <span className="text-blue-400 font-semibold">iOS</span> is under development.<br />
          Stay tuned — we're launching very soon! 🎉
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-2xl text-sm font-bold transition"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

// ─── About Modal ──────────────────────────────────────────────────────────────
function AboutModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">About <span className="text-white">Nex</span><span className="text-purple-400">Orbite</span></h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition">✕</button>
        </div>

        {/* Everything in One Place */}
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

        {/* How it Works */}
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
                <p className="text-3xl font-extrabold text-purple-500/30 mb-1">{s.step}</p>
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-gray-500 text-xs mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-2xl text-sm font-bold transition">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Trending Community Circle ────────────────────────────────────────────────
function CommunityCircle({ c, onClick }) {
  const letter = c.college_name?.[0]?.toUpperCase() || "C";
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 flex-shrink-0 group"
    >
      <div className="relative">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 border-2 border-purple-500/40 group-hover:border-purple-400 transition overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
          {c.logo_url ? (
            <img src={c.logo_url} alt={c.college_name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-xl font-extrabold text-white">{letter}</span>
          )}
        </div>
        {/* Member count badge */}
        <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-black leading-tight">
          {c.usageCount > 999 ? `${Math.floor(c.usageCount / 1000)}k` : c.usageCount || 0}
        </span>
      </div>
      <span className="text-[10px] text-gray-400 group-hover:text-white transition text-center max-w-[60px] leading-tight truncate">
        {c.college_name?.split(" ")[0] || "College"}
      </span>
    </button>
  );
}
function ProductCard({ p }) {
  const [imgError, setImgError] = useState(false);
 
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all group flex-shrink-0 w-64 sm:w-auto cursor-pointer">
 
      {/* Thumbnail */}
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
          <div className="w-full h-full flex items-center justify-center text-4xl bg-purple-900/20">
            📦
          </div>
        )}
 
        {/* Price badge */}
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
            p.isPaid ? "bg-purple-600 text-white" : "bg-green-600 text-white"
          }`}>
            {p.isPaid ? `₹${p.price || 0}` : "Free"}
          </span>
        </div>
 
        {/* Trending badge */}
        {p.isTrending && (
          <div className="absolute top-2 left-2">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-orange-500/90 text-white">
              🔥 Trending
            </span>
          </div>
        )}
      </div>
 
      {/* Info */}
      <div className="p-4">
 
        {/* Branch tag */}
        {p.branch && (
          <span className="text-purple-400 text-[10px] font-bold uppercase tracking-widest">
            {p.branch}
          </span>
        )}
 
        {/* Title */}
        <h3 className="text-white font-semibold text-sm mt-1 mb-1 line-clamp-2 leading-tight">
          {p.title || "Untitled Product"}
        </h3>
 
        {/* Description */}
        {p.description && (
          <p className="text-gray-500 text-xs line-clamp-2 mb-3">{p.description}</p>
        )}
 
        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <span>🛒 {p.salesCount || 0} sold</span>
          <span>👁 {p.viewCount || 0} views</span>
        </div>
 
        {/* ── College Info ── */}
        {p.college?.name && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            {/* College logo ya letter */}
            <div className="w-5 h-5 rounded-full bg-purple-600/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {p.college.logo ? (
                <img
                  src={p.college.logo}
                  alt={p.college.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <span className="text-[8px] font-bold text-purple-300">
                  {p.college.name[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 truncate">{p.college.name}</p>
              {p.college.university && (
                <p className="text-[9px] text-gray-700 truncate">{p.college.university}</p>
              )}
            </div>
          </div>
        )}
 
      </div>
    </div>
  );
}

// ─── MAIN HOME ────────────────────────────────────────────────────────────────
export default function Home() {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats,       setStats]       = useState({ totalUsers: 0, totalCommunities: 0 });
  const [products,    setProducts]    = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [inviteCode,  setInviteCode]  = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showDownload, setShowDownload] = useState(false);
  const [showAbout,    setShowAbout]   = useState(false);

  useEffect(() => {
    if (!user) refreshUser();
  }, []); // eslint-disable-line

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [statsRes, productsRes, communitiesRes] = await Promise.all([
          api.get("/api/home/stats"),
          api.get(`/api/home/trending-products${user?.branch ? `?userBranch=${user.branch}` : ""}`),
 
          api.get("/api/home/trending-communities"),
        ]);
        if (!isMounted) return;
        setStats(statsRes.data.data       || { totalUsers: 0, totalCommunities: 0 });
        setProducts(productsRes.data.data  || []);
        setCommunities(communitiesRes.data.data || []);

        console.log("Trending Products API Response:", productsRes.data);

      } catch (err) {
        console.error("Home fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

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

  // Top 10 communities for circles
  const topCommunities = communities.slice(0, 10);

  return (
    <div className="bg-black text-white min-h-screen">

      {/* Modals */}
      {showDownload && <DownloadModal onClose={() => setShowDownload(false)} />}
      {showAbout    && <AboutModal   onClose={() => setShowAbout(false)} />}

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 w-full z-[100] bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-4">
          {/* Logo */}
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight flex-shrink-0">
            <span className="text-white">Nex</span><span className="text-purple-400">Orbite</span>
          </div>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-6 text-sm text-gray-400">
            <button onClick={() => setShowAbout(true)} className="hover:text-white transition">About NexOrbite</button>
            <a href="#marketplace" className="hover:text-white transition">Marketplace</a>
            <a href="#community"   className="hover:text-white transition">Communities</a>
          </div>

          {/* Right: avatar / sign in */}
          {user ? (
            <Link to="/profile" className="flex-shrink-0">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || "U")}&background=7c3aed&color=fff`}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-purple-500 object-cover hover:scale-105 transition"
              />
            </Link>
          ) : (
            <Link to="/login" className="bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-full text-sm font-semibold transition flex-shrink-0">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-28 pb-10 min-h-[85vh]">
        <span className="text-purple-400 text-xs font-bold tracking-[0.25em] uppercase mb-5 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10">
          India's First Campus Ecosystem
        </span>

        {/* ── Trending Community Circles ── */}
        {!loading && topCommunities.length > 0 && (
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 overflow-x-auto pb-2 max-w-full px-2">
            {topCommunities.map((c) => (
              <CommunityCircle
                key={c._id}
                c={c}
                onClick={() => {
                  const isMember = user?.collegeId && String(user.collegeId) === String(c._id);
                  if (isMember) {
                    navigate(`/community/${c._id}`);
                  } else {
                    setSelectedCommunity(c);
                    setShowModal(true);
                  }
                }}
              />
            ))}
          </div>
        )}
        {loading && (
          <div className="flex gap-3 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-14 h-14 rounded-full bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        <h1 className="text-4xl md:text-7xl font-extrabold leading-tight mb-5">
          Build. Sell. <br />
          <span className="text-purple-500">Collaborate.</span>
        </h1>
        <p className="text-gray-400 text-base md:text-xl max-w-2xl mb-8">
          NexOrbite connects students across colleges — share projects, sell digital
          products, and grow your campus network.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowDownload(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-full text-base transition"
          >
            📱 Download App
          </button>
          <button
            onClick={() => setShowAbout(true)}
            className="border border-white/20 hover:border-purple-500 text-white font-semibold px-8 py-4 rounded-full text-base transition"
          >
            Learn More
          </button>
        </div>

        {/* Stats */}
        <div className="mt-14 flex flex-col sm:flex-row gap-8 sm:gap-12 text-center">
          <div>
            <p className="text-4xl font-extrabold text-purple-400">{loading ? "..." : `${stats.totalUsers}+`}</p>
            <p className="text-gray-500 mt-1 text-sm">Students</p>
          </div>
          <div className="hidden sm:block w-px bg-white/10" />
          <div>
            <p className="text-4xl font-extrabold text-purple-400">{loading ? "..." : `${stats.totalCommunities}+`}</p>
            <p className="text-gray-500 mt-1 text-sm">Communities</p>
          </div>
          <div className="hidden sm:block w-px bg-white/10" />
          <div>
            <p className="text-4xl font-extrabold text-purple-400">6+</p>
            <p className="text-gray-500 mt-1 text-sm">Branches</p>
          </div>
        </div>
      </section>

      {/* ── TRENDING PRODUCTS (hero ke neeche, full section) ────────────────── */}
      <section id="marketplace" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold">Trending Products</h2>
              <p className="text-gray-500 text-sm mt-1">Top selling student work right now</p>
            </div>
            {products.length > 0 && (
              <span className="text-purple-400 text-xs font-semibold">{products.length} items</span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-white/[0.03] border border-white/8 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🛒</div>
              <p className="text-gray-500">No products yet — be the first to sell!</p>
            </div>
          ) : (
            <>
              {/* Mobile: horizontal scroll */}
              <div className="flex gap-4 overflow-x-auto pb-3 sm:hidden scrollbar-none">
                {products.map((p) => <ProductCard key={p._id} p={p} />)}
              </div>
              {/* Desktop: grid */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((p) => <ProductCard key={p._id} p={p} />)}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── TRENDING COMMUNITIES (full cards) ───────────────────────────────── */}
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
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-white/[0.03] border border-white/8 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🏫</div>
              <p className="text-gray-500">No communities yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {communities.map((c) => {
                const isMember = user?.collegeId && String(user.collegeId) === String(c._id);
                return (
                  <div
                    key={c._id}
                    onClick={() => {
                      if (isMember) {
                        navigate(`/community/${c._id}`);
                      } else {
                        setSelectedCommunity(c);
                        setShowModal(true);
                      }
                    }}
                    className="bg-black border border-white/10 hover:border-purple-500/50 rounded-2xl p-5 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-lg font-extrabold flex-shrink-0 group-hover:scale-110 transition overflow-hidden">
                        {c.logo_url
                          ? <img src={c.logo_url} alt={c.college_name} className="w-full h-full object-cover" loading="lazy" />
                          : c.college_name?.[0]?.toUpperCase() || "C"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{c.college_name}</h3>
                        <p className="text-gray-500 text-xs truncate">{c.university}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold flex-shrink-0 ${isMember ? "bg-green-500/20 text-green-400" : "bg-white/5 text-gray-400"}`}>
                        {isMember ? "Enter →" : "Join"}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs line-clamp-2 mb-3">{c.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>👥 {c.usageCount || 0} members</span>
                      {c.category && <span className="px-2 py-0.5 rounded-full bg-white/5">{c.category}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── DOWNLOAD CTA ────────────────────────────────────────────────────── */}
      <section id="download" className="py-24 px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
          Ready to <span className="text-purple-500">Join?</span>
        </h2>
        <p className="text-gray-400 text-base mb-8 max-w-lg mx-auto">
          Download NexOrbite and become part of India's fastest growing student ecosystem.
        </p>
        <button
          onClick={() => setShowDownload(true)}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-10 py-4 rounded-full text-lg transition"
        >
          📱 Download NexOrbite
        </button>
      </section>

      {/* ── JOIN MODAL ───────────────────────────────────────────────────────── */}
      {showModal && selectedCommunity && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-extrabold text-lg overflow-hidden flex-shrink-0">
                {selectedCommunity.logo_url
                  ? <img src={selectedCommunity.logo_url} alt="" className="w-full h-full object-cover" />
                  : selectedCommunity.college_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-sm">{selectedCommunity.college_name}</h3>
                <p className="text-gray-500 text-xs">{selectedCommunity.university}</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-4">Enter the invite code shared by your college admin.</p>
            <input
              className="w-full p-3 mb-4 bg-black border border-white/20 rounded-xl text-white outline-none uppercase tracking-[0.2em] text-center font-mono text-lg focus:border-purple-500 transition"
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="INVITE CODE"
              maxLength={12}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowModal(false); setInviteCode(""); }}
                className="flex-1 px-4 py-2.5 text-gray-400 border border-white/10 rounded-xl text-sm font-semibold hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={joinCommunity}
                disabled={!inviteCode.trim()}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl text-white text-sm font-bold transition"
              >
                Join →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}