// src/components/digitalProduct/ProductCard.jsx
import BranchBadge from "./BranchBadge";

export default function ProductCard({ product, onClick, footer }) {
  const seller = product.sellerId; // populated { fullName, username, avatar } or null

  return (
    <div
      onClick={onClick}
      className="bg-white/[0.03] border border-white/8 rounded-3xl overflow-hidden cursor-pointer hover:border-brand-500/40 hover:bg-white/[0.05] transition group"
    >
      <div className="aspect-video bg-navy-900/40 overflow-hidden relative">
        <img
          src={product.thumbnailUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute top-2 left-2">
          <BranchBadge branch={product.branch} />
        </div>
        {product.price === 0 ? (
          <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-300 font-bold uppercase">
            Free
          </span>
        ) : (
          <span className="absolute top-2 right-2 text-xs px-2.5 py-1 rounded-full bg-navy-900/70 border border-white/10 text-white font-bold">
            ₹{product.price}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">{product.category}</p>
        <h3 className="font-bold text-white text-sm leading-snug line-clamp-2">{product.title}</h3>

        {seller && (
          <div className="flex items-center gap-2 mt-3">
            <img
              src={seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.fullName || "U")}&background=5b54a4&color=fff`}
              alt={seller.fullName}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs text-gray-500 truncate">{seller.fullName || seller.username}</span>
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-600">
          {typeof product.salesCount === "number" && <span>🛒 {product.salesCount}</span>}
          {typeof product.viewCount === "number" && <span>👁 {product.viewCount}</span>}
        </div>

        {footer}
      </div>
    </div>
  );
}