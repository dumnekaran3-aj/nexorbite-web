import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import NotificationBell from "../NotificationBell";

export default function Navbar({ onAboutClick }) {
  const [open, setOpen] = useState(false);
  const { user } = useContext(AuthContext);

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="text-white font-bold text-2xl tracking-tight flex-shrink-0">
          Nex<span className="text-purple-500">Orbite</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          {onAboutClick && (
            <button onClick={onAboutClick} className="hover:text-white transition">
              About NexOrbite
            </button>
          )}
        </div>

        {/* Right side: Marketplace pill + Notification + Profile/Sign-in */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-purple-500/40 hover:border-purple-400 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-white text-sm font-semibold transition"
          >
             🛍️ See  Projects
          </Link>

          {user ? ( 
            <>
              <NotificationBell />
              <Link to="/profile" className="flex-shrink-0">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username || "U")}&background=7c3aed&color=fff`}
                  alt="Profile"
                  className="w-9 h-9 rounded-full border-2 border-purple-500 object-cover hover:scale-105 transition"
                />
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile: Marketplace pill + Notification Bell + Menu Button */}
        <div className="md:hidden flex items-center gap-2.5">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs font-semibold transition flex-shrink-0"
          >
            🛍️ <span className="hidden xs:inline">Buy</span>
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
        <div className="md:hidden bg-black/95 px-4 pb-4 flex flex-col gap-4 text-gray-400 text-sm border-b border-white/10">
          {onAboutClick && (
            <button
              onClick={() => { onAboutClick(); setOpen(false); }}
              className="text-left hover:text-white"
            >
              About NexOrbite
            </button>
          )}

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