import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import api from "../lib/api";

export default function Home() {
  const [stats, setStats] = useState({ totalUsers: 0, totalCommunities: 0 });
  const [products, setProducts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, []);


  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />

      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
        <span className="text-purple-400 text-sm font-semibold tracking-widest uppercase mb-4">
          India's First Campus Ecosystem
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
          Build. Sell. <br />
          <span className="text-purple-500">Collaborate.</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10">
          NexOrbit connects students across colleges — share projects, sell digital
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
              { step: "01", title: "Download App", desc: "Get NexOrbit from Play Store for free." },
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
                  <span className="text-purple-400 text-xs font-semibold uppercase">
                    {p.branch}
                  </span>
                  <h3 className="text-white font-semibold mt-1 mb-2 truncate">{p.title}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-purple-400 font-bold">
                      {p.isPaid ? `₹${p.price}` : "Free"}
                    </p>
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
          <p className="text-gray-400 text-center mb-16">Active college communities on NexOrbit</p>
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : communities.length === 0 ? (
            <p className="text-center text-gray-500">No communities yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((c) => (
                <div
                  key={c._id}
                  className="bg-black border border-white/10 rounded-2xl p-6 hover:border-purple-500 transition"
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
          Download NexOrbit and become part of India's fastest growing student ecosystem.
        </p>
        <a
          href="https://play.google.com/store"
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold px-10 py-4 rounded-full text-lg transition"
        >
          Download on Play Store
        </a>
      </section>

      <Footer />
    </div>
  );
}