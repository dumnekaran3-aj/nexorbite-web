export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 text-gray-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="text-white font-bold text-xl">
          Nex<span className="text-purple-500">Orbit</span>
          <p className="text-gray-500 text-xs font-normal mt-1">Campus Ecosystem & Skill Marketplace</p>
        </div>

        <div className="flex gap-6">
          <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
          <a href="/terms"   className="hover:text-white transition">Terms of Service</a>
          <a href="/contact" className="hover:text-white transition">Contact</a>
        </div>

        <div className="flex flex-col items-center md:items-end gap-1">
          <p>© 2025 NexOrbit. All rights reserved.</p>
          <p className="text-xs text-gray-600">
            Co-founded by{" "}
            <span className="text-gray-400 font-medium">Karan</span>
            {" "}&{" "}
            <span className="text-gray-400 font-medium">Aryan</span>
          </p>
        </div>

      </div>
    </footer>
  );
}