// src/components/digitalproducts/ProductActions.jsx
//
// Reusable Like + Share row for digital products. Used on:
//   - ProductCard (Marketplace / My Products grids)
//   - CommunityView's feed cards
//   - ProductDetailPage (full-size)
//
// Fully self-contained: owns its own liked/likeCount/shareCount state
// (seeded from props), talks to the backend directly, and never throws —
// every action degrades to a toast-friendly error object instead of
// crashing whatever page embeds it.
import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { toggleLikeProduct, shareProductLink, shareProductToFriend } from "../../lib/digitalproduct.api";

// ─── Share Sheet — "Copy Link" + "Send to a friend" ─────────────────────────
function ShareSheet({ productId, onClose, onShared }) {
  const [copying, setCopying]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [friends, setFriends]   = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [sendingTo, setSendingTo]           = useState(null); // friendId currently sending
  const [sentTo, setSentTo]                 = useState(new Set());
  const [error, setError]       = useState("");

  // Lazy-load friends only when the sheet actually opens (this component
  // only mounts while the sheet is shown).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/ecosystem/friends/");
        if (!cancelled) setFriends(Array.isArray(res.data?.friends) ? res.data.friends : []);
      } catch {
        if (!cancelled) setFriends([]);
      } finally {
        if (!cancelled) setLoadingFriends(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCopyLink = useCallback(async () => {
    setCopying(true);
    setError("");
    try {
      const res = await shareProductLink(productId);
      if (!res.success) {
        setError(res.msg || "Could not generate link");
        return;
      }
      await navigator.clipboard.writeText(res.shareUrl);
      setCopied(true);
      onShared?.(res.shareCount);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link");
    } finally {
      setCopying(false);
    }
  }, [productId, onShared]);

  const handleSendToFriend = useCallback(
    async (friendId) => {
      setSendingTo(friendId);
      setError("");
      try {
        const res = await shareProductToFriend({ to: friendId, productId });
        if (!res.success) {
          setError(res.msg || "Could not send");
          return;
        }
        setSentTo((prev) => new Set([...prev, friendId]));
        onShared?.(res.shareCount);
      } finally {
        setSendingTo(null);
      }
    },
    [productId, onShared]
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-navy-950/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0d0d0d] border border-white/10 rounded-3xl w-full max-w-sm max-h-[75vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/8 flex-shrink-0">
          <h3 className="font-bold text-white">Share Project</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition text-lg"
          >
            ×
          </button>
        </div>

        <div className="p-5 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={copying}
            className={`w-full py-3 rounded-2xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
              copied
                ? "bg-green-600/20 border border-green-500/40 text-green-300"
                : "bg-brand-600 hover:bg-brand-500 text-white"
            }`}
          >
            {copying ? "Generating…" : copied ? "✓ Link Copied!" : "🔗 Copy Link"}
          </button>
          {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
        </div>

        <div className="px-5 pb-2 flex-shrink-0">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Send to a friend</p>
        </div>

        <div className="overflow-y-auto px-5 pb-5 flex-1">
          {loadingFriends ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">
              You don't have any friends yet to share with.
            </p>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => {
                const alreadySent = sentTo.has(f._id);
                return (
                  <div
                    key={f._id}
                    className="flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-2xl px-3 py-2.5"
                  >
                    <img
                      src={f.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.fullName || f.username || "U")}&background=5b54a4&color=fff`}
                      alt={f.fullName}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{f.fullName || f.username}</p>
                      <p className="text-xs text-gray-600 truncate">@{f.username}</p>
                    </div>
                    <button
                      type="button"
                      disabled={sendingTo === f._id || alreadySent}
                      onClick={() => handleSendToFriend(f._id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition ${
                        alreadySent
                          ? "bg-green-600/20 text-green-300 border border-green-500/30"
                          : "bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50"
                      }`}
                    >
                      {sendingTo === f._id ? "…" : alreadySent ? "✓ Sent" : "Send"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ProductActions({
  productId,
  initialLiked = false,
  initialLikeCount = 0,
  initialShareCount = 0,
  size = "sm", // "sm" (card) | "md" (detail page)
}) {
  const [liked, setLiked]         = useState(!!initialLiked);
  const [likeCount, setLikeCount] = useState(Number(initialLikeCount) || 0);
  const [shareCount, setShareCount] = useState(Number(initialShareCount) || 0);
  const [liking, setLiking]       = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleToggleLike = useCallback(
    async (e) => {
      e?.stopPropagation();
      if (liking || !productId) return;
      setLiking(true);

      // Optimistic update — instant feedback, corrected below if the
      // request actually fails or disagrees with our guess.
      const prevLiked = liked;
      const prevCount = likeCount;
      setLiked(!prevLiked);
      setLikeCount(prevLiked ? Math.max(prevCount - 1, 0) : prevCount + 1);

      try {
        const res = await toggleLikeProduct(productId);
        if (res.success) {
          setLiked(res.liked);
          setLikeCount(res.likeCount);
        } else {
          // Revert on failure
          setLiked(prevLiked);
          setLikeCount(prevCount);
        }
      } finally {
        setLiking(false);
      }
    },
    [productId, liking, liked, likeCount]
  );

  const openShare = useCallback((e) => {
    e?.stopPropagation();
    setShowShare(true);
  }, []);

  const sizeCls = size === "md" ? "text-sm px-4 py-2.5 gap-2" : "text-xs px-3 py-1.5 gap-1.5";

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={!productId}
        className={`flex items-center rounded-full border font-semibold transition ${sizeCls} ${
          liked
            ? "bg-red-500/15 border-red-500/40 text-red-300"
            : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
        }`}
      >
        <span>{liked ? "❤️" : "🤍"}</span>
        <span>{likeCount}</span>
      </button>

      <button
        type="button"
        onClick={openShare}
        disabled={!productId}
        className={`flex items-center rounded-full border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 font-semibold transition ${sizeCls}`}
      >
        <span>🔗</span>
        <span>{shareCount}</span>
      </button>

      {showShare && (
        <ShareSheet
          productId={productId}
          onClose={() => setShowShare(false)}
          onShared={(newCount) => {
            if (typeof newCount === "number") setShareCount(newCount);
            else setShareCount((c) => c + 1);
          }}
        />
      )}
    </div>
  );
}