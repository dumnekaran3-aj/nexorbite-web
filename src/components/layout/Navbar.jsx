import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";// AuthContext import kiya

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useContext(AuthContext); // User state access ki

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="text-white font-bold text-2xl tracking-tight">
          Nex<span className="text-purple-500">Orbite</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
          <a href="#marketplace" className="hover:text-white transition">Marketplace</a>
          <a href="#community" className="hover:text-white transition">Community</a>
        </div>

        {/* Auth / Download Section */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link to="/profile">
              <img 
                src={user.avatar || "https://ui-avatars.com/api/?name=" + user.username} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border border-purple-500 object-cover"
              />
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white text-2xl"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-black/95 px-4 pb-4 flex flex-col gap-4 text-gray-400 text-sm border-b border-white/10">
          <a href="#features" onClick={() => setOpen(false)} className="hover:text-white">Features</a>
          <a href="#how-it-works" onClick={() => setOpen(false)} className="hover:text-white">How It Works</a>
          <a href="#marketplace" onClick={() => setOpen(false)} className="hover:text-white">Marketplace</a>
          <a href="#community" onClick={() => setOpen(false)} className="hover:text-white">Community</a>
          
          {user ? (
            <Link to="/profile" onClick={() => setOpen(false)} className="text-purple-500 font-semibold">My Profile</Link>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="bg-purple-600 text-white text-center py-2 rounded-full">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}