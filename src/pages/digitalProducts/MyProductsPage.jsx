// src/pages/digitalProduct/MyProductsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProducts, deleteDigitalProduct } from "../../lib/digitalproduct.api";
import ProductCard from "../../components/digitalproducts/ProductCard";
import Toast, { useToast } from "../../components/ui/Toast";

export default function MyProductsPage() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyProducts();
      setProducts(data);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load your products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (productId) => {
    setDeletingId(productId);
    try {
      await deleteDigitalProduct(productId);
      setProducts((p) => p.filter((x) => x._id !== productId));
      showToast("Product deleted", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Delete failed", "error");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-16">
      <Toast toast={toast} />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">📦 My Products</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your listed bundles</p>
          </div>
          <button
            onClick={() => navigate("/sell-product")}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition"
          >
            + New Listing
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-10 text-center">
            <div className="w-14 h-14 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">📦</div>
            <h3 className="font-bold text-lg">No listings yet</h3>
            <p className="text-gray-500 text-sm mt-1 mb-5">Turn your projects into income — list your first bundle.</p>
            <button onClick={() => navigate("/sell-product")} className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition">
              💰 Sell Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onClick={() => navigate(`/marketplace/${product._id}`)}
                footer={
                  <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {confirmId === product._id ? (
                      <>
                        <button
                          onClick={() => handleDelete(product._id)}
                          disabled={deletingId === product._id}
                          className="flex-1 py-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-600/30 transition disabled:opacity-50"
                        >
                          {deletingId === product._id ? "Deleting..." : "Confirm Delete"}
                        </button>
                        <button onClick={() => setConfirmId(null)} className="px-3 py-2 rounded-xl border border-white/10 text-gray-400 text-xs">
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmId(product._id)}
                        className="flex-1 py-2 rounded-xl border border-white/8 text-gray-400 hover:text-red-400 hover:border-red-500/40 text-xs font-semibold transition"
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}