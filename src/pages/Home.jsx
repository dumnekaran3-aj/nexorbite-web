import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

export default function Home() {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats, setStats] = useState({ totalUsers: 0, totalCommunities: 0 });
  const [products, setProducts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  useEffect(() => {
    if (!user) {
      refreshUser();
    }
  }, []);

useEffect(() => {
  let isMounted = true; // Component unmount hone par data set na ho

  const fetchData = async () => {
    try {
      // Abhi aap 3 requests ek saath bhej rahe hain
      const [statsRes, productsRes, communitiesRes] = await Promise.all([
        api.get("/api/home/stats"),
        api.get("/api/home/trending-products"),
        api.get("/api/home/trending-communities"),
      ]);
      
      if (isMounted) {
        setStats(statsRes.data.data);
        setProducts(productsRes.data.data);
        setCommunities(communitiesRes.data.data);
      }
    } catch (err) {
      console.error("Error fetching home data:", err);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  fetchData();

  return () => { isMounted = false; }; // Cleanup
}, []);

  const joinCommunity = async () => {
    try {
      await api.post("/api/createcollege/join", {
        invite_code: inviteCode,
      });
      alert("Successfully joined!");
      await refreshUser();
      setShowModal(false);
      window.location.reload();
    } catch (err) {
      if (err.response?.status === 400) {
        setShowModal(false);
        navigate(`/community/${selectedCommunity._id}`);
      } else {
        alert(err.response?.data?.msg || "Something went wrong");
      }
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 w-full z-[100] bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="text-xl sm:text-2xl font-bold tracking-tight">NexOrbite</div>
          {user ? (
            <Link to="/profile">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullName}`}
                alt="Profile"
                className="w-10 h-10 rounded-full border border-purple-500 object-cover"
              />
            </Link>
          ) : (
            <Link to="/login" className="bg-purple-600 px-6 py-2 rounded-full flex-shrink-0">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 min-h-[90vh]">
        <span className="text-purple-400 text-sm font-semibold tracking-widest uppercase mb-4">
          India's First Campus Ecosystem
        </span>
        <h1 className="text-4xl md:text-7xl font-extrabold leading-tight mb-6">
          Build. Sell. <br />
          <span className="text-purple-500">Collaborate.</span>
        </h1>
        <p className="text-gray-400 text-base md:text-xl max-w-2xl mb-10">
          NexOrbite connects students across colleges — share projects, sell digital
          products, and grow your campus network.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#download"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-full text-lg transition"
          >
            Download App
          </a>
          <a
            href="#features"
            className="border border-white/20 hover:border-purple-500 text-white font-semibold px-8 py-4 rounded-full text-lg transition"
          >
            Learn More
          </a>
        </div>

        {/* Stats */}
        <div className="mt-20 flex flex-col sm:flex-row gap-10 text-center">
          <div>
            <p className="text-4xl font-extrabold text-purple-400">
              {loading ? "..." : `${stats.totalUsers}+`}
            </p>
            <p className="text-gray-500 mt-1">Students</p>
          </div>
          <div className="hidden sm:block w-px bg-white/10" />
          <div>
            <p className="text-4xl font-extrabold text-purple-400">
              {loading ? "..." : `${stats.totalCommunities}+`}
            </p>
            <p className="text-gray-500 mt-1">Communities</p>
          </div>
          <div className="hidden sm:block w-px bg-white/10" />
          <div>
            <p className="text-4xl font-extrabold text-purple-400">6+</p>
            <p className="text-gray-500 mt-1">Branches</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4">Everything in One Place</h2>
        <p className="text-gray-400 text-center mb-16">Built for students, by students</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "🏫", title: "Campus Community", desc: "Join your college via invite code. Private, verified, real." },
            { icon: "🛒", title: "Skill Marketplace", desc: "Sell CAD files, code, PCB layouts, notes and more." },
            { icon: "💬", title: "Real-time Chat", desc: "1-on-1 and group chat with your college community." },
            { icon: "🤝", title: "Collaborate", desc: "Find skilled students across branches for your projects." },
            { icon: "💰", title: "Earn Money", desc: "Monetize your skills while still in college." },
            { icon: "🔐", title: "Role Management", desc: "Owner, Principal, HOD, Teacher, Student — full control." },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500 transition"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-4 bg-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 mb-16">3 simple steps to get started</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Download App", desc: "Get NexOrbite from Play Store for free." },
              { step: "02", title: "Join Your College", desc: "Use invite code to join your campus community." },
              { step: "03", title: "Build & Earn", desc: "Share projects, sell products, collaborate." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="text-5xl font-extrabold text-purple-500/30 mb-4">{s.step}</div>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRENDING PRODUCTS ── */}
      <section id="marketplace" className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4">Trending Products</h2>
        <p className="text-gray-400 text-center mb-16">Top selling student work right now</p>
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">No products yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p._id}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500 transition"
              >
                <img
                  src={p.thumbnailUrl || "/placeholder.png"}
                  alt={p.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <span className="text-purple-400 text-xs font-semibold uppercase">{p.branch}</span>
                  <h3 className="text-white font-semibold mt-1 mb-2 truncate">{p.title}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-purple-400 font-bold">{p.isPaid ? `₹${p.price}` : "Free"}</p>
                    <p className="text-gray-500 text-xs">{p.salesCount} sold</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── TRENDING COMMUNITIES ── */}
      <section id="community" className="py-24 px-4 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Trending Communities</h2>
          <p className="text-gray-400 text-center mb-16">Active college communities on NexOrbite</p>

          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : communities.length === 0 ? (
            <p className="text-center text-gray-500">No communities yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((c) => {
                const isMember = user && user.collegeId && String(user.collegeId) === String(c._id);
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
                    className="bg-black border border-white/10 rounded-2xl p-6 hover:border-purple-500 transition cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-xl font-bold mb-4 group-hover:scale-110 transition">
                      {c.college_name?.[0]?.toUpperCase() || "C"}
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-1 truncate">{c.college_name}</h3>
                    <p className="text-gray-500 text-sm mb-3">{c.university}</p>
                    <p className="text-gray-400 text-sm line-clamp-2">{c.description}</p>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-purple-400 text-sm font-semibold">{c.usageCount || 0} members</p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          isMember ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white"
                        }`}
                      >
                        {isMember ? "Enter Community" : "Join Now"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-zinc-900 p-6 rounded-xl border border-white/10 w-80 shadow-2xl">
                <h3 className="text-white font-bold mb-1">Join {selectedCommunity?.college_name}</h3>
                <p className="text-gray-400 text-xs mb-4">Enter your invite code.</p>
                <input
                  className="w-full p-2 mb-4 bg-black border border-white/20 rounded text-white outline-none uppercase tracking-widest"
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="INVITE CODE"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 text-white border border-white/10 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={joinCommunity}
                    className="flex-1 px-4 py-2 bg-purple-600 rounded text-white font-bold"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── DOWNLOAD ── */}
      <section id="download" className="py-24 px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
          Ready to <span className="text-purple-500">Join?</span>
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
          Download NexOrbite and become part of India's fastest growing student ecosystem.
        </p>
        <a
          href="https://play.google.com/store/apps/details?id=com.nexorbite"
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold px-10 py-4 rounded-full text-lg transition"
        >
          Download on Play Store
        </a>
      </section>

    </div>
  );
}