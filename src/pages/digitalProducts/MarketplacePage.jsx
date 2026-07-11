// src/pages/digitalProduct/MarketplacePage.jsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProducts } from "../../lib/digitalproduct.api";
import ProductCard from "../../components/digitalproducts/ProductCard";
import Toast, { useToast } from "../../components/ui/Toast";
import { BRANCHES, BRANCH_CATEGORIES } from "../../constants/digitalProduct.constants";

const LIMIT = 20;

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [branch, setBranch]     = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);

  const [products, setProducts]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (branch)   params.branch   = branch;
      if (category) params.category = category;
      if (search)   params.search   = search;

      const res = await getAllProducts(params);
      setProducts(res.data);
      setTotal(res.totalProducts);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load marketplace", "error");
    } finally {
      setLoading(false);
    }
  }, [branch, category, search, page]);

  useEffect(() => { load(); }, [load]);

  const categories = branch ? BRANCH_CATEGORIES[branch] : [];
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-16">
      <Toast toast={toast} />
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">🛍️ Marketplace</h1>
          <p className="text-gray-500 text-sm mt-1">Discover projects, notes and bundles from students across colleges</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Search products..."
            className="flex-1 bg-white/5 border border-white/8 rounded-2xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-purple-500 transition"
          />
          <select
            value={branch}
            onChange={(e) => { setBranch(e.target.value); setCategory(""); setPage(1); }}
            className="bg-white/5 border border-white/8 rounded-2xl px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500 transition"
          >
            <option value="">All Branches</option>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          {branch && (
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/8 rounded-2xl px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500 transition"
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-10 text-center">
            <div className="w-14 h-14 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">🔍</div>
            <h3 className="font-bold text-lg">No products found</h3>
            <p className="text-gray-500 text-sm mt-1">Try a different search or filter combination.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} onClick={() => navigate(`/marketplace/${product._id}`)} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl border border-white/8 text-gray-400 disabled:opacity-30 hover:text-white transition text-sm"
                >
                  ← Prev
                </button>
                <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl border border-white/8 text-gray-400 disabled:opacity-30 hover:text-white transition text-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}