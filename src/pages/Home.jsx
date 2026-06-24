import { useEffect, useState } from "react";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

export default function Home() {
  const { user,refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
=======

import api from "../lib/api";

import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Home() {

  const { user } = useContext(AuthContext);
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d

  const [stats, setStats] = useState({ totalUsers: 0, totalCommunities: 0 });
  const [products, setProducts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
<<<<<<< HEAD
  const [inviteCode, setInviteCode] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState(null);



useEffect(() => {
    // Jab bhi page load ho, profile refresh karo taaki latest collegeId mil jaye
    if (!user) {
        refreshUser();
    }
}, []);
=======
const [inviteCode, setInviteCode] = useState("");
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d



  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, productsRes, communitiesRes] = await Promise.all([
          api.get("/api/home/stats"),
          api.get("/api/home/trending-products"),
          api.get("/api/home/trending-communities"),
        ]);
        setStats(statsRes.data.data);
        setProducts(productsRes.data.data);
        setCommunities(communitiesRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
<<<<<<< HEAD
  }, []);
  const joinCommunity = async () => {
    try {
  await api.post("/api/createcollege/join", {
      invite_code: inviteCode,
    });
    alert("Successfully joined!");

    await refreshUser();
    setShowModal(false);
    
    // Yahan "refresh" call karein (Aapke AuthContext mein jo fetchUser/loadUser function hoga)
    // fetchUser(); 
    
    // Refresh karne ke baad page reload na karein, balki state update hone ka wait karein
    // Agar refresh function nahi hai, toh tabhi window.location.reload() use karein.
    window.location.reload();
    } catch (err) {
      // 400 error ka matlab server bata raha hai ki user already member hai
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

      {/* ── HERO ── */}
=======





  }, []);


  const joinCommunity = async () => {
    try {
      if (!inviteCode) return alert("Please enter code");
      
      const res = await api.post("/api/createcollege/join", { invite_code: inviteCode });
      alert("Joined successfully!");
      setShowModal(false);
      window.location.reload(); 
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to join");
    }
  };




  return (
 <div className="bg-black text-white min-h-screen">
      
      {/* ── NAVBAR (Fix: Added max-w-7xl and flex-shrink-0 for the button) ── */}
      <nav className="fixed top-0 left-0 w-full z-[100] bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="text-xl sm:text-2xl font-bold tracking-tight">NexOrbite</div>
          
          {/* Sign In Button: Added flex-shrink-0 to prevent hiding */}
{user ? (
  <Link to="/profile">
    <img 
      src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullName}`} 
      alt="Profile" 
      className="w-10 h-10 rounded-full border border-purple-500 object-cover"
    />
  </Link>
) : (
  <Link to="/login" className="bg-purple-600 px-6 py-2 rounded-full">
    Sign In
  </Link>
)}
        </div>
      </nav>

      {/* ── HERO SECTION (Padding top increased to clear fixed navbar) ── */}
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
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
<<<<<<< HEAD
=======
        
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="#download" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-full text-lg transition">
            Download App
          </a>
          <a href="#features" className="border border-white/20 hover:border-purple-500 text-white font-semibold px-8 py-4 rounded-full text-lg transition">
            Learn More
          </a>
        </div>

<<<<<<< HEAD
=======
        {/* Stats */}
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
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
<<<<<<< HEAD
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500 transition">
=======
            <div
              key={f.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500 transition"
            >
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
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
<<<<<<< HEAD

      {/* ── TRENDING PRODUCTS ── */}
=======
   {/* ── TRENDING PRODUCTS ── */}
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
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
<<<<<<< HEAD
              <div key={p._id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500 transition">
                <img src={p.thumbnailUrl || "/placeholder.png"} alt={p.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <span className="text-purple-400 text-xs font-semibold uppercase">{p.branch}</span>
                  <h3 className="text-white font-semibold mt-1 mb-2 truncate">{p.title}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-purple-400 font-bold">{p.isPaid ? `₹${p.price}` : "Free"}</p>
=======
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
                  <span className="text-purple-400 text-xs font-semibold uppercase">
                    {p.branch}
                  </span>
                  <h3 className="text-white font-semibold mt-1 mb-2 truncate">{p.title}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-purple-400 font-bold">
                      {p.isPaid ? `₹${p.price}` : "Free"}
                    </p>
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
                    <p className="text-gray-500 text-xs">{p.salesCount} sold</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
<<<<<<< HEAD
=======
   
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d

    {/* ── TRENDING COMMUNITIES ── */}
<section id="community" className="py-24 px-4 bg-white/5">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-4xl font-bold text-center mb-4">Trending Communities</h2>
    <p className="text-gray-400 text-center mb-16">Active college communities on NexOrbite</p>
<<<<<<< HEAD

=======
    
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
    {loading ? (
      <p className="text-center text-gray-500">Loading...</p>
    ) : communities.length === 0 ? (
      <p className="text-center text-gray-500">No communities yet</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
<<<<<<< HEAD
        {communities.map((c) => {
          // Logic: Check membership (Ensure user and user.collegeId exist before comparing)
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
                <span className={`text-xs px-2 py-1 rounded ${isMember ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white'}`}>
                  {isMember ? "Enter Community" : "Join Now"}
                </span>
              </div>
            </div>
          );
        })}
=======
        {communities.map((c) => (
          <div
            key={c._id}
            // FIX: Yahan onClick add kiya hai
            onClick={() => setShowModal(true)} 
            className="bg-black border border-white/10 rounded-2xl p-6 hover:border-purple-500 transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-xl font-bold mb-4">
              {c.college_name?.[0] || "C"}
            </div>
            <h3 className="text-white font-semibold text-lg mb-1 truncate">
              {c.college_name}
            </h3>
            <p className="text-gray-500 text-sm mb-3">{c.university}</p>
            <p className="text-gray-400 text-sm line-clamp-2">{c.description}</p>
            <p className="text-purple-400 text-sm font-semibold mt-3">
              {c.usageCount} members
            </p>
          </div>
        ))}
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
      </div>
    )}

    {/* Modal */}
    {showModal && (
<<<<<<< HEAD
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
            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-white border border-white/10 rounded">
              Cancel
            </button>
            <button onClick={joinCommunity} className="flex-1 px-4 py-2 bg-purple-600 rounded text-white font-bold">
=======
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-zinc-900 p-6 rounded-xl border border-white/10 w-80">
          <h3 className="text-white font-bold mb-4">Enter Invite Code</h3>
          <input 
            maxLength={8}
            className="w-full p-2 mb-4 bg-black border border-white/20 rounded text-white"
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="8 Character Code"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-white">Cancel</button>
            <button 
              onClick={joinCommunity} 
              className="px-4 py-2 bg-purple-600 rounded text-white font-bold"
            >
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
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
<<<<<<< HEAD

=======
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
        <a
          href="https://play.google.com/store/apps/details?id=com.nexorbite"
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold px-10 py-4 rounded-full text-lg transition"
        >
          Download on Play Store
        </a>
      </section>
<<<<<<< HEAD

    </div>
=======
    </div>






>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
  );
}