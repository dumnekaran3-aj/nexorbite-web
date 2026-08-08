// src/components/digitalproducts/ProductFeedPost.jsx
//
// FIX (Issue #4): pehle ye component sirf pages/Home.jsx ke andar locked
// tha (not exported), isliye CommunityView.jsx ka feed apna alag, chota
// grid-card use karta tha jisme likes/share bhi missing the. Ab isse
// extract karke shared bana diya hai — Home.jsx aur CommunityView.jsx
// dono isi ek component ko use karte hain, taaki dono jagah bilkul same
// dikhe aur future me sirf ek jagah maintain karna pade.
import { useState } from "react";
import { Link } from "react-router-dom";
import ProductActions from "./ProductActions";
import {
  ShoppingBag, Eye, Flame, GraduationCap, ArrowUpRight, ImageOff,
} from "lucide-react";

// ─── Feed-style Product Post (X / Bluesky style) ────────────────────────────
// Layout mirrors a real social post: avatar on the left, everything else
// stacked to the right — header line, then the "post text" (title +
// description), THEN the attached media card, then an evenly-spaced action
// row (views · sold · like · share) exactly like Twitter's reply/retweet/
// like/share row. Own component so one broken image/college-logo never
// breaks the rest of the feed (isolated error state per post).
export default function ProductFeedPost({ p, onOpen }) {
  const [imgError, setImgError]   = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const hasImage = !!p.thumbnailUrl && !imgError;

  // identity ab hamesha SELLER hai, community/college nahi. Seller ka apna
  // avatar + username dikhta hai aur unke profile (/profile/:userId) pe
  // link karta hai. `p.seller` (community feed) aur `p.sellerId` (home
  // page pipe) dono shapes support karta hai.
  const seller     = p.seller || p.sellerId || null;
  const hasAvatar  = !!seller?.avatar && !avatarError;
  const sellerName = seller?.username || seller?.fullName || "Independent Seller";

  return (
    <article className="flex gap-3 px-1 py-4 border-b border-white/8 last:border-b-0 hover:bg-white/[0.015] transition">
      {/* ── Avatar column — links to the seller's own profile ──────────── */}
      <Link
        to={seller?._id ? `/profile/${seller._id}` : "#"}
        onClick={(e) => e.stopPropagation()}
        className="w-11 h-11 rounded-full bg-brand-600/30 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10 mt-0.5"
      >
        {hasAvatar ? (
          <img src={seller.avatar} alt={sellerName} className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
        ) : (
          <GraduationCap size={18} className="text-brand-300" />
        )}
      </Link>

      {/* ── Content column ────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">

        {/* Header line — seller identity + trending badge, Twitter-style */}
        <div className="flex items-center gap-1.5 min-w-0 mb-0.5">
          <Link
            to={seller?._id ? `/profile/${seller._id}` : "#"}
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-[15px] truncate hover:underline"
          >
            {sellerName}
          </Link>
          {p.branch && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400 flex-shrink-0 ml-auto sm:ml-0">
              {p.branch}
            </span>
          )}
          {p.isTrending && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25 flex-shrink-0">
              <Flame size={10} /> Trending
            </span>
          )}
        </div>

        {/* "Post text" — title is the tweet, description is the caption below */}
        <button type="button" onClick={onOpen} className="block text-left w-full">
          <p className="text-white text-[15px] leading-snug font-medium">
            {p.title || "Untitled Product"}
            <span className={`ml-2 inline-block align-middle text-xs font-bold px-2 py-0.5 rounded-full ${p.isPaid ? "bg-brand-600/20 text-brand-300" : "bg-green-600/20 text-green-400"}`}>
              {p.isPaid ? `₹${p.price || 0}` : "Free"}
            </span>
          </p>
          {p.description && (
            <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mt-1">{p.description}</p>
          )}
        </button>

        {/* Attached media card — Twitter-style: rounded, bordered, below the text */}
        <button
          type="button"
          onClick={onOpen}
          className="block w-full rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10 mt-3"
        >
          {hasImage ? (
            <img
              src={p.thumbnailUrl}
              alt={p.title || "Product"}
              className="w-full max-h-[420px] object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full aspect-[16/9] flex flex-col items-center justify-center gap-2 text-gray-600">
              <ImageOff size={26} />
              <span className="text-xs">No preview available</span>
            </div>
          )}
        </button>

        {/* Action row — evenly spaced like Twitter's reply/retweet/like/share row */}
        <div className="flex items-center justify-between max-w-sm mt-3 text-gray-500">
          <span className="inline-flex items-center gap-1.5 text-xs">
            <Eye size={15} /> {p.viewCount || 0}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <ShoppingBag size={15} /> {p.salesCount || 0}
          </span>

          {/* LIKE/SHARE — real, working buttons */}
          <ProductActions
            productId={p._id}
            initialLiked={p.isLiked}
            initialLikeCount={p.likeCount}
            initialShareCount={p.shareCount}
            size="sm"
          />

          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-semibold text-xs transition"
          >
            View <ArrowUpRight size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}