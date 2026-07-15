// src/pages/digitalProduct/ProductDetailPage.jsx
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  getProductDetails,
  leaveProductEngagement,
  getAssetDownloadUrl,
  claimFreeProduct,
} from "../../lib/digitalproduct.api";
import { useRazorpay } from "../../hooks/useRazorpay";
import BranchBadge from "../../components/digitalproducts/BranchBadge";
import Toast, { useToast } from "../../components/ui/Toast";
// src/pages/digitalProduct/ProductDetailPage.jsx


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

  return (
    <div className="min-h-screen bg-navy-900 text-white pt-20 px-4 pb-16">
      <Toast toast={toast} />
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Cover + basic info */}
        <div className="bg-white/[0.03] border border-white/8 rounded-3xl overflow-hidden">
          <div className="aspect-video bg-navy-900/40">
            <img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover" />
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <BranchBadge branch={product.branch} size="md" />
              <span className="text-xs text-gray-500">{product.category}</span>
            </div>
            <h1 className="text-2xl font-bold">{product.title}</h1>

            {seller && (
              <div
                onClick={() => navigate(`/profile/${seller._id}`)}
                className="flex items-center gap-2 mt-3 cursor-pointer group w-fit"
              >
                <img
                  src={seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.fullName || "U")}&background=5b54a4&color=fff`}
                  alt={seller.fullName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold group-hover:text-brand-400 transition">{seller.fullName}</p>
                  <p className="text-xs text-gray-600">@{seller.username}</p>
                </div>
              </div>
            )}

            <p className="text-gray-400 text-sm leading-relaxed mt-4 whitespace-pre-wrap">{product.description}</p>

            {product.attributes?.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                {product.attributes.map((a, i) => (
                  <div key={i} className="bg-white/5 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-gray-500 uppercase">{a.label}</p>
                    <p className="text-sm text-white truncate">{a.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buy / Access box */}
        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Price</p>
              <p className="text-3xl font-bold text-brand-400">{isFree ? "Free" : `₹${product.price}`}</p>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>🛒 {product.salesCount} sold</span>
              <span>👁 {product.viewCount} views</span>
            </div>
          </div>

          {product.isOwner ? (
            <div className="space-y-3">
              <div className="text-center py-3 rounded-2xl bg-white/5 border border-white/8 text-gray-400 text-sm font-semibold">
                👑 This is your listing
              </div>
              <button
                onClick={handleDownloadBundle}
                disabled={downloadingBundle}
                className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm transition flex items-center justify-center gap-2"
              >
                {downloadingBundle ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Zipping bundle...</>
                ) : "⬇ Download Full Bundle (.zip)"}
              </button>
            </div>
          ) : product.canDownload ? (
            <div className="space-y-3">
              <div className="text-center py-3 rounded-2xl bg-green-600/10 border border-green-500/30 text-green-300 text-sm font-semibold">
                ✓ You own this bundle
              </div>
              <button
                onClick={handleDownloadBundle}
                disabled={downloadingBundle}
                className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm transition flex items-center justify-center gap-2"
              >
                {downloadingBundle ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Zipping bundle...</>
                ) : "⬇ Download Full Bundle (.zip)"}
              </button>
            </div>
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

        {/* Assets — informational list only. Actual download happens via the
            single "Download Full Bundle" button above (one ZIP, not per-file). */}
        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-3">
            Bundle Contents ({product.assets?.length || 0} files)
          </p>
          <div className="space-y-2">
            {product.assets?.map((a) => (
              <div key={a.slot} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{a.label}</p>
                  <p className="text-xs text-gray-600">{a.fileType} {a.size ? `· ${(a.size / 1024 / 1024).toFixed(1)}MB` : ""}</p>
                </div>
                {(product.canDownload || product.isOwner) ? (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-green-600/10 border border-green-500/30 text-green-400 flex-shrink-0">✓ Included</span>
                ) : (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-gray-500 flex-shrink-0">🔒 Locked</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}