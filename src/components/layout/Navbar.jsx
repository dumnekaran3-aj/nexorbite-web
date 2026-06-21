import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <div className="text-white font-bold text-2xl tracking-tight">
          Nex<span className="text-purple-500">Orbit</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#features"    className="hover:text-white transition">Features</a>
          <a href="#how-it-works"className="hover:text-white transition">How It Works</a>
          <a href="#marketplace" className="hover:text-white transition">Marketplace</a>
          <a href="#community"   className="hover:text-white transition">Community</a>
        </div>

        {/* Download Button */}
        <a
          href="#download"
          className="hidden md:block bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition"
        >
          Download App
        </a>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white text-2xl"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-black/95 px-4 pb-4 flex flex-col gap-4 text-gray-400 text-sm">
          <a href="#features"    onClick={() => setOpen(false)} className="hover:text-white">Features</a>
          <a href="#how-it-works" onClick={() => setOpen(false)} className="hover:text-white">How It Works</a>
          <a href="#marketplace"  onClick={() => setOpen(false)} className="hover:text-white">Marketplace</a>
          <a href="#community"    onClick={() => setOpen(false)} className="hover:text-white">Community</a>
          <a href="#download"     onClick={() => setOpen(false)} className="bg-purple-600 text-white text-center py-2 rounded-full">Download App</a>
        </div>
      )}
    </nav>
  );
}