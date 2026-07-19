// src/pages/digitalProduct/MyLibraryPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserLibrary, downloadProductBundle } from "../../lib/digitalproduct.api";
import BranchBadge from "../../components/digitalproducts/BranchBadge";
import Toast, { useToast } from "../../components/ui/Toast";
// src/pages/digitalProduct/MyLibraryPage.jsx

export default function MyLibraryPage() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getUserLibrary();
        setProducts(res.data);
      } catch (err) {
        showToast(err?.response?.data?.message || "Failed to load your library", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadBundle = async (product) => {
    setDownloadingId(product._id);
    try {
      await downloadProductBundle(product._id, product.title);
    } catch (err) {
      showToast(err?.response?.data?.message || "Bundle download failed", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white pt-20 px-4 pb-16">
      <Toast toast={toast} />
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">📚 My Library</h1>
          <p className="text-gray-500 text-sm mt-1">Everything you've purchased or claimed for free</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-10 text-center">
            <div className="w-14 h-14 bg-brand-600/10 border border-brand-500/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">📚</div>
            <h3 className="font-bold text-lg">Your library is empty</h3>
            <p className="text-gray-500 text-sm mt-1 mb-5">Browse the marketplace to find your first project bundle.</p>
            <button onClick={() => navigate("/marketplace")} className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition">
              🛍️ Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product._id} className="bg-white/[0.03] border border-white/8 rounded-3xl p-5">
                <div className="flex items-start gap-4">
                  <img src={product.thumbnailUrl} alt={product.title} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BranchBadge branch={product.branch} />
                      {!product.canDownload && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 font-bold">Preview only</span>
                      )}
                    </div>
                    <h3 onClick={() => navigate(`/marketplace/${product._id}`)} className="font-bold text-sm truncate cursor-pointer hover:text-brand-400 transition">
                      {product.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">{product.category}</p>
                  </div>
                </div>

                {product.canDownload && (
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => handleDownloadBundle(product)}
                      disabled={downloadingId === product._id}
                      className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      {downloadingId === product._id ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Zipping bundle...</>
                      ) : `⬇ Download Full Bundle (${product.assets?.length || 0} files, .zip)`}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}