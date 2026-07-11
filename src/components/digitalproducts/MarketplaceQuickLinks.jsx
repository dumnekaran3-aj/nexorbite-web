// src/components/digitalProduct/MarketplaceQuickLinks.jsx
import { useNavigate } from "react-router-dom";

export default function MarketplaceQuickLinks() {
  const navigate = useNavigate();

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-5">
      <p className="text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-3">Marketplace</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={() => navigate("/sell-product")}
          className="py-3 rounded-2xl bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 font-bold text-sm transition flex items-center justify-center gap-1.5"
        >
          💰 Sell a Project
        </button>
        <button
          onClick={() => navigate("/my-products")}
          className="py-3 rounded-2xl border border-white/10 hover:bg-white/5 hover:border-white/20 text-gray-300 hover:text-white font-semibold text-sm transition flex items-center justify-center gap-1.5"
        >
          📦 My Products
        </button>
        <button
          onClick={() => navigate("/my-library")}
          className="py-3 rounded-2xl border border-white/10 hover:bg-white/5 hover:border-white/20 text-gray-300 hover:text-white font-semibold text-sm transition flex items-center justify-center gap-1.5"
        >
          📚 My Library
        </button>
      </div>
    </div>
  );
}