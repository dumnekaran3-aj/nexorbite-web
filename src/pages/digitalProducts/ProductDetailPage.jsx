// src/pages/digitalProduct/ProductDetailPage.jsx
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  getProductDetails,
  leaveProductEngagement,
  downloadProductBundle,
  claimFreeProduct,
} from "../../lib/digitalproduct.api";
import { useRazorpay } from "../../hooks/useRazorpay";
import BranchBadge from "../../components/digitalproducts/BranchBadge";
import Toast, { useToast } from "../../components/ui/Toast";

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox — full-screen click-to-enlarge viewer, used for both the product
// cover image and the seller's avatar.
// ─────────────────────────────────────────────────────────────────────────────
function Lightbox({ src, alt, onClose }) {
  if (!src) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-navy-900/90 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl transition"
      >
        ✕
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
      />
    </div>
  );
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const { buyProduct, loading: paying } = useRazorpay();

  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [downloadingBundle, setDownloadingBundle] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { src, alt } | null

  const load = async () => {
    setLoading(true);
    try {
      const data = await getProductDetails(productId);
      setProduct(data);
    } catch (err) {
      showToast(err?.response?.data?.message || "Product not found", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Tell backend user left this product page — stops the bounce/impression timer
    return () => { leaveProductEngagement(productId).catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleBuy = async () => {
    try {
      if (product.price === 0) {
        setClaiming(true);
        await claimFreeProduct(product._id);
        showToast("Unlocked! Enjoy your download. 🎉", "success");
      } else {
        await buyProduct(product, { userName: user?.fullName, userEmail: user?.email });
        showToast("Payment successful! Bundle unlocked. 🎉", "success");
      }
      await load(); // refresh canDownload + assets
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || "Purchase failed", "error");
    } finally {
      setClaiming(false);
    }
  };

  const handleDownloadBundle = async () => {
    setDownloadingBundle(true);
    try {
      await downloadProductBundle(product._id, product.title);
    } catch (err) {
      showToast(err?.response?.data?.message || "Bundle download failed", "error");
    } finally {
      setDownloadingBundle(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-navy-900 text-white pt-20 px-4 text-center">
        <p className="text-gray-500">Product not found or no longer available.</p>
      </div>
    );
  }

  const seller = product.sellerId;
  const isFree = product.price === 0;
  const unlocked = product.isOwner || product.canDownload;

  const sellerAvatarUrl =
    seller?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.fullName || "U")}&background=4a4488&color=fff`;

  return (
    <div className="min-h-screen bg-navy-900 text-white pt-20 px-4 pb-24">
      <Toast toast={toast} />

      <Lightbox src={lightbox?.src} alt={lightbox?.alt} onClose={() => setLightbox(null)} />

      <div className="max-w-2xl mx-auto">

        {/* ── Cover image — click to enlarge ───────────────────────────── */}
        <button
          type="button"
          onClick={() => setLightbox({ src: product.thumbnailUrl, alt: product.title })}
          className="block w-full aspect-video rounded-2xl overflow-hidden bg-white/[0.03] mb-6 group relative"
        >
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300"
          />
          <span className="absolute bottom-3 right-3 text-[11px] px-2.5 py-1 rounded-full bg-navy-900/70 backdrop-blur text-gray-300 opacity-0 group-hover:opacity-100 transition">
            🔍 Click to enlarge
          </span>
        </button>

        {/* ── Title & tags ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-2">
          <BranchBadge branch={product.branch} size="md" />
          <span className="text-xs text-gray-500">{product.category}</span>
        </div>
        <h1 className="text-2xl font-bold leading-snug">{product.title}</h1>

        {/* ── Seller row — avatar click enlarges, name click opens profile ─ */}
        {seller && (
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => setLightbox({ src: sellerAvatarUrl, alt: seller.fullName })}
              className="shrink-0"
            >
              <img
                src={sellerAvatarUrl}
                alt={seller.fullName}
                className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition"
              />
            </button>
            <button
              type="button"
              onClick={() => navigate(`/profile/${seller._id}`)}
              className="text-left group"
            >
              <p className="text-sm font-semibold group-hover:text-brand-400 transition">
                {seller.fullName}
              </p>
              <p className="text-xs text-gray-600">@{seller.username}</p>
            </button>
          </div>
        )}

        {/* ── Description ──────────────────────────────────────────────── */}
        {product.description && (
          <p className="text-gray-400 text-[15px] leading-relaxed mt-5 whitespace-pre-wrap">
            {product.description}
          </p>
        )}

        {/* ── Attributes — plain key/value list, no grid of boxes ─────────── */}
        {product.attributes?.length > 0 && (
          <dl className="mt-5 divide-y divide-white/8 border-t border-b border-white/8">
            {product.attributes.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <dt className="text-xs text-gray-500 uppercase tracking-wide">{a.label}</dt>
                <dd className="text-sm text-white text-right truncate max-w-[60%]">{a.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* ── Stats + price row ─────────────────────────────────────────── */}
        <div className="flex items-end justify-between mt-8 pt-5 border-t border-white/10">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Price</p>
            <p className="text-3xl font-bold text-brand-400">{isFree ? "Free" : `₹${product.price}`}</p>
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>🛒 {product.salesCount} sold</span>
            <span>👁 {product.viewCount} views</span>
          </div>
        </div>

        {/* ── Access status + action button ────────────────────────────── */}
        <div className="mt-4">
          {product.isOwner && (
            <p className="text-sm text-gray-400 mb-3">👑 This is your listing</p>
          )}
          {!product.isOwner && product.canDownload && (
            <p className="text-sm text-green-400 mb-3">✓ You own this bundle</p>
          )}

          {unlocked ? (
            <button
              onClick={handleDownloadBundle}
              disabled={downloadingBundle}
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm transition flex items-center justify-center gap-2"
            >
              {downloadingBundle ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Zipping bundle...</>
              ) : "⬇ Download Full Bundle (.zip)"}
            </button>
          ) : (
            <button
              onClick={handleBuy}
              disabled={paying || claiming}
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm transition flex items-center justify-center gap-2"
            >
              {paying || claiming ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
              ) : isFree ? "⬇ Get for Free" : `💳 Buy Now — ₹${product.price}`}
            </button>
          )}
        </div>

        {/* ── Bundle contents — plain list, dividers instead of pill-boxes ── */}
        <div className="mt-9">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">
            Bundle Contents · {product.assets?.length || 0} {product.assets?.length === 1 ? "file" : "files"}
          </p>
          <div className="divide-y divide-white/8 border-t border-white/8">
            {product.assets?.map((a) => (
              <div key={a.slot} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.label}</p>
                  <p className="text-xs text-gray-600">
                    {a.fileType}{a.size ? ` · ${(a.size / 1024 / 1024).toFixed(1)}MB` : ""}
                  </p>
                </div>
                {unlocked ? (
                  <span className="text-xs text-green-400 flex-shrink-0">✓ Included</span>
                ) : (
                  <span className="text-xs text-gray-600 flex-shrink-0">🔒 Locked</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}