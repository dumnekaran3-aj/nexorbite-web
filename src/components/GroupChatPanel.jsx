// src/components/GroupChatPanel.jsx
//
// WhatsApp-style group chat: opening a group (from CommunityView's Groups
// tab) opens THIS chat screen. Management features (members, join-requests,
// promote/demote, add-member, leave/delete, edit info) live INSIDE this
// panel and only open when the user taps the group's avatar/name in the
// header — exactly like tapping a WhatsApp group's header opens "Group Info".
//
// Reuses Icon / RoleBadge / ImageModal already exported from ChatPanel.jsx
// so icons/styling stay visually consistent with the 1-on-1 chat.

import { useEffect, useState, useRef, useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getSocket } from "../lib/socket";
import { Icon, RoleBadge, ImageModal } from "./ChatPanel";
import * as groupApi from "../lib/group.api";

const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtSize = (b) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);
const fmtDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// Sticker tap-animation — emotion-matched movement (spec: "stickers ko touch
// karne ke bad unique movement do emoji-emotion se matched"). Har animation
// CSS keyframe se driven hai (neeche <StickerAnimStyles/> me define hain),
// class temporarily lagti hai tap pe, khatam hone pe apne aap hat jaati hai.
const STICKER_ANIMATIONS = {
  sticker_wave:     "anim-wave",
  sticker_thumbsup: "anim-bounce",
  sticker_laugh:    "anim-shake",
  sticker_heart:    "anim-heartbeat",
  sticker_fire:     "anim-flicker",
  sticker_clap:     "anim-clap",
  sticker_party:    "anim-pop",
  sticker_love:     "anim-heartbeat",
  sticker_shock:    "anim-jitter",
  sticker_cool:     "anim-tilt",
  sticker_cry:      "anim-wobble",
  sticker_think:    "anim-tilt-slow",
};

// Ek hi baar poore document me inject hota hai (StickerAnimStyles ko main
// component me ek baar render karo). Plain <style> tag — koi extra library
// nahi chahiye Vite/CRA me isse kaam chalane ke liye.
function StickerAnimStyles() {
  return (
    <style>{`
      @keyframes anim-wave     { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-18deg)} 40%{transform:rotate(14deg)} 60%{transform:rotate(-10deg)} 80%{transform:rotate(6deg)} }
      @keyframes anim-bounce   { 0%,100%{transform:translateY(0) scale(1)} 30%{transform:translateY(-14px) scale(1.08)} 55%{transform:translateY(0) scale(0.96)} 75%{transform:translateY(-5px)} }
      @keyframes anim-shake    { 0%,100%{transform:translateX(0) rotate(0)} 15%{transform:translateX(-6px) rotate(-6deg)} 30%{transform:translateX(6px) rotate(6deg)} 45%{transform:translateX(-6px) rotate(-4deg)} 60%{transform:translateX(6px) rotate(4deg)} 80%{transform:translateX(-2px)} }
      @keyframes anim-heartbeat{ 0%,100%{transform:scale(1)} 15%{transform:scale(1.3)} 30%{transform:scale(1)} 45%{transform:scale(1.25)} 60%{transform:scale(1)} }
      @keyframes anim-flicker  { 0%,100%{transform:scale(1) rotate(0)} 20%{transform:scale(1.1) rotate(-4deg)} 40%{transform:scale(0.95) rotate(3deg)} 60%{transform:scale(1.08) rotate(-2deg)} 80%{transform:scale(0.98) rotate(2deg)} }
      @keyframes anim-clap     { 0%,100%{transform:scale(1) rotate(0)} 25%{transform:scale(1.2) rotate(-8deg)} 50%{transform:scale(1) rotate(8deg)} 75%{transform:scale(1.15) rotate(-4deg)} }
      @keyframes anim-pop      { 0%{transform:scale(1) rotate(0)} 40%{transform:scale(1.35) rotate(10deg)} 70%{transform:scale(0.95) rotate(-6deg)} 100%{transform:scale(1) rotate(0)} }
      @keyframes anim-jitter   { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-3px,-3px)} 40%{transform:translate(3px,3px)} 60%{transform:translate(-3px,2px)} 80%{transform:translate(2px,-2px)} }
      @keyframes anim-tilt     { 0%,100%{transform:rotate(0) scale(1)} 30%{transform:rotate(-10deg) scale(1.1)} 60%{transform:rotate(6deg) scale(1.05)} }
      @keyframes anim-wobble   { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-8deg)} 50%{transform:rotate(0)} 75%{transform:rotate(8deg)} }
      @keyframes anim-tilt-slow{ 0%,100%{transform:rotate(0)} 50%{transform:rotate(-10deg)} }
      .anim-wave      { animation: anim-wave 0.7s ease-in-out; }
      .anim-bounce    { animation: anim-bounce 0.6s ease-in-out; }
      .anim-shake     { animation: anim-shake 0.6s ease-in-out; }
      .anim-heartbeat { animation: anim-heartbeat 0.7s ease-in-out; }
      .anim-flicker   { animation: anim-flicker 0.6s ease-in-out; }
      .anim-clap      { animation: anim-clap 0.6s ease-in-out; }
      .anim-pop       { animation: anim-pop 0.5s ease-out; }
      .anim-jitter    { animation: anim-jitter 0.5s ease-in-out; }
      .anim-tilt      { animation: anim-tilt 0.6s ease-in-out; }
      .anim-wobble    { animation: anim-wobble 0.7s ease-in-out; }
      .anim-tilt-slow { animation: anim-tilt-slow 0.8s ease-in-out; }
      .msg-highlight-flash { animation: msg-flash 1.6s ease-out; }
      @keyframes msg-flash { 0%,15%{background-color:rgba(124,58,237,0.35)} 100%{background-color:transparent} }
    `}</style>
  );
}

// ─── EmojiReactionBar ───────────────────────────────────────────────────────
function ReactionPicker({ onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute -top-11 left-0 z-30 bg-[#1c1c1e] border border-white/10 rounded-full px-2 py-1.5 shadow-2xl flex gap-1">
      {REACTION_EMOJIS.map((em) => (
        <button key={em} type="button" onClick={() => onPick(em)} className="text-lg hover:scale-125 transition leading-none">{em}</button>
      ))}
    </div>
  );
}

// ─── WhatsAppActionMenu (long-press context menu) ────────────────────────
function WhatsAppActionMenu({ isMe, canDeleteAny, myReaction, anchorSide, onReact, onReply, onDeleteMe, onDeleteAll, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("touchstart", h); };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute z-40 top-0 ${anchorSide === "me" ? "right-0" : "left-0"} bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[190px] text-sm`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-center gap-2 px-3 py-2.5 border-b border-white/10">
        {REACTION_EMOJIS.map((em) => (
          <button key={em} type="button" onClick={() => { onReact(em); onClose(); }} className={`text-xl hover:scale-125 transition leading-none ${myReaction === em ? "scale-125" : ""}`}>{em}</button>
        ))}
      </div>
      <button type="button" onClick={() => { onReply(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition text-left">{Icon.reply} Reply</button>
      <button type="button" onClick={() => { onDeleteMe(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition text-left">{Icon.trash} Delete for me</button>
      {(isMe || canDeleteAny) && (
        <button type="button" onClick={() => { onDeleteAll(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-red-400 transition text-left">{Icon.trash} Delete for everyone</button>
      )}
    </div>
  );
}

// ─── MessageBubble ──────────────────────────────────────────────────────────
function MessageBubble({ msg, isMe, canDeleteAny, onDeleteMe, onDeleteAll, onReact, onRemoveReaction, myId, onReply, onImageClick, onVideoClick, stickerMap, selectMode, isSelected, onToggleSelect, onJumpToReply, highlighted }) {
  const [showMenu, setShowMenu] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [stickerAnim, setStickerAnim] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isSwipingRef = useRef(false);
  const longPressTimer = useRef(null);
  const longPressFiredRef = useRef(false);
  const SWIPE_TRIGGER = 56;
  const SWIPE_MAX = 80;
  const LONG_PRESS_MS = 450;

  // ── Swipe-to-reply + long-press-to-open-menu, dono ek hi touch se
  // handle karte hain (WhatsApp jaisa): finger horizontal move kare to
  // swipe-reply, static rakhe to long-press menu khule.
  const handleTouchStart = (e) => {
    if (selectMode) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwipingRef.current = false;
    longPressFiredRef.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!isSwipingRef.current) {
        longPressFiredRef.current = true;
        setShowMenu(true);
        if (navigator.vibrate) navigator.vibrate(20);
      }
    }, LONG_PRESS_MS);
  };

  const handleTouchMove = (e) => {
    if (selectMode || touchStartX.current == null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isSwipingRef.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      isSwipingRef.current = Math.abs(dx) > Math.abs(dy);
      if (isSwipingRef.current) clearTimeout(longPressTimer.current); // swipe shuru -> long-press cancel
      if (!isSwipingRef.current) return;
    }

    const clamped = Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, dx));
    setSwipeX(clamped);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    if (Math.abs(swipeX) >= SWIPE_TRIGGER) {
      onReply(msg);
      if (navigator.vibrate) navigator.vibrate(15);
    }
    setSwipeX(0);
    touchStartX.current = null;
    isSwipingRef.current = false;
  };

  // Desktop: click-and-hold (mouse) bhi long-press jaisa kaam kare
  const handleMouseDown = () => {
    if (selectMode) return;
    longPressFiredRef.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setShowMenu(true);
    }, LONG_PRESS_MS);
  };
  const handleMouseUp = () => clearTimeout(longPressTimer.current);

  const handleBubbleClick = () => {
    if (selectMode) { onToggleSelect(msg._id); return; }
    if (longPressFiredRef.current) { longPressFiredRef.current = false; return; } // long-press ke baad click suppress
  };

  const handleStickerTap = () => {
    if (selectMode) { onToggleSelect(msg._id); return; }
    setStickerAnim(false);
    requestAnimationFrame(() => setStickerAnim(true));
  };

  if (msg.isDeletedForEveryone) {
    return (
      <div id={`msg-${msg._id}`} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
        <div className="italic text-xs text-gray-500 bg-white/[0.03] px-3 py-2 rounded-2xl">This message was deleted</div>
      </div>
    );
  }

  const myReaction = msg.reactions?.find((r) => String(r.userId) === String(myId));
  const isPureMedia = (msg.mediaType === "image" || msg.mediaType === "video") && !msg.text;
  const isSticker = msg.messageType === "sticker" && msg.stickerId;
  const animClass = STICKER_ANIMATIONS[msg.stickerId] || "anim-pop";

  const replyThumb = (r) => {
    if (!r) return null;
    if (r.messageType === "sticker" && r.stickerId) return <span className="text-xl leading-none">{stickerMap[r.stickerId] || "🏷️"}</span>;
    if (r.mediaType === "image" && r.mediaUrl) return <img src={r.mediaUrl} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />;
    if (r.mediaType === "video" && r.mediaUrl) return <video src={r.mediaUrl} className="w-9 h-9 rounded object-cover flex-shrink-0" />;
    return null;
  };

  const replyPreviewLabel = (r) => {
    if (!r) return "";
    if (r.isDeletedForEveryone) return "Original message was deleted";
    if (r.text) return r.text;
    if (r.messageType === "sticker") return "Sticker";
    if (r.mediaType === "image") return "📷 Photo";
    if (r.mediaType === "video") return "🎥 Video";
    if (r.mediaType === "voice") return "🎤 Voice message";
    if (r.mediaType === "file") return "📎 File";
    return "Media";
  };

  // Timestamp+ticks pill — media/sticker pe overlay (semi-transparent dark
  // pill), text-bubble ke andar inline (WhatsApp jaisa dono jagah alag style)
  const TimePill = ({ overlay }) => (
    <span className={`flex items-center gap-1 ${overlay ? "bg-black/45 backdrop-blur-sm rounded-full px-2 py-0.5" : ""}`}>
      <span className={`text-[10.5px] ${overlay ? "text-white/90" : "opacity-60"}`}>{fmtTime(msg.createdAt)}</span>
      {isMe && msg.seenBy?.length > 1 && <span className={overlay ? "text-white/90" : "opacity-80"}>{Icon.seendbl}</span>}
    </span>
  );

  return (
    <div
      id={`msg-${msg._id}`}
      className={`flex ${isMe ? "justify-end" : "justify-start"} ${msg.reactions?.length > 0 ? "mb-4" : "mb-2"} group relative touch-pan-y ${selectMode ? "cursor-pointer" : ""} ${highlighted ? "msg-highlight-flash rounded-2xl" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleBubbleClick}
      style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? "transform 0.2s ease-out" : "none" }}
    >
      {selectMode && (
        <div className={`flex items-center ${isMe ? "order-2 ml-2" : "mr-2"}`}>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-brand-600 border-brand-600" : "border-gray-500"}`}>
            {isSelected && <span className="text-white text-[10px]">✓</span>}
          </div>
        </div>
      )}

      {swipeX !== 0 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 text-brand-400"
          style={{ [swipeX > 0 ? "left" : "right"]: -28, opacity: Math.min(Math.abs(swipeX) / SWIPE_TRIGGER, 1) }}
        >
          {Icon.reply}
        </div>
      )}

      <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
        {!isMe && msg.sender?.username && !isSticker && (
          <p className="text-xs text-brand-400 font-semibold ml-1 mb-0.5">{msg.sender.username}</p>
        )}

        <div className="relative">
          {showMenu && (
            <WhatsAppActionMenu
              isMe={isMe}
              canDeleteAny={canDeleteAny}
              myReaction={myReaction?.emoji}
              anchorSide={isMe ? "me" : "other"}
              onReact={(emoji) => onReact(msg._id, emoji)}
              onReply={() => onReply(msg)}
              onDeleteMe={() => onDeleteMe(msg._id)}
              onDeleteAll={() => onDeleteAll(msg._id)}
              onClose={() => setShowMenu(false)}
            />
          )}

          {/* ── STICKER: no bubble background, big, tap-to-animate ── */}
          {isSticker ? (
            <div className="flex flex-col items-start">
              {!isMe && msg.sender?.username && (
                <p className="text-xs text-brand-400 font-semibold ml-1 mb-0.5">{msg.sender.username}</p>
              )}
              <div
                onClick={handleStickerTap}
                className={`text-[84px] leading-none cursor-pointer select-none ${stickerAnim ? animClass : ""}`}
                onAnimationEnd={() => setStickerAnim(false)}
              >
                {stickerMap[msg.stickerId] || "🏷️"}
              </div>
              <div className="ml-1 mt-0.5"><TimePill overlay={false} /></div>
            </div>
          ) : isPureMedia ? (
            /* ── PURE IMAGE/VIDEO (no caption): full-bleed, rounded, time overlay ── */
            <div className="relative rounded-2xl overflow-hidden max-w-[260px]">
              {msg.replyTo && (
                <button type="button" onClick={() => onJumpToReply(msg.replyTo._id)} className="w-full flex items-center gap-2 text-[11px] opacity-90 bg-black/30 border-l-2 border-white/50 pl-2 pr-2 py-1 text-left">
                  {replyThumb(msg.replyTo)}
                  <span className="min-w-0">
                    <p className="font-semibold truncate">{msg.replyTo.senderName}</p>
                    <p className="line-clamp-1 opacity-75">{replyPreviewLabel(msg.replyTo)}</p>
                  </span>
                </button>
              )}
              {msg.mediaType === "image" && (
                <img src={msg.mediaUrl} alt="" onClick={() => onImageClick(msg.mediaUrl)} className="block w-full max-h-80 object-cover cursor-zoom-in" />
              )}
              {msg.mediaType === "video" && (
                <div className="relative cursor-pointer" onClick={() => onVideoClick(msg.mediaUrl)}>
                  <video src={msg.mediaUrl} className="block w-full max-h-80 object-cover pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                      <div className="w-0 h-0 border-y-[9px] border-y-transparent border-l-[15px] border-l-white ml-1" />
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute bottom-1.5 right-1.5"><TimePill overlay /></div>
              {msg.reactions?.length > 0 && (
                <div className="absolute -bottom-3 right-2 z-10 bg-[#1c1c1e] border border-white/10 rounded-full px-1.5 py-0.5 flex gap-0.5 shadow">
                  {msg.reactions.slice(0, 3).map((r, i) => <span key={i} className="text-xs">{r.emoji}</span>)}
                  {msg.reactions.length > 3 && <span className="text-[10px] text-gray-400">+{msg.reactions.length - 3}</span>}
                </div>
              )}
            </div>
          ) : (
            /* ── TEXT / VOICE / FILE / media-with-caption: normal bubble ── */
            <div className={`rounded-2xl px-3.5 py-2 relative ${isMe ? "bg-brand-600 text-white" : "bg-white/[0.06] text-gray-100"}`}>
              {msg.replyTo && (
                <button type="button" onClick={() => onJumpToReply(msg.replyTo._id)} className="w-full flex items-center gap-2 text-[11px] opacity-90 bg-black/15 rounded-lg border-l-2 border-white/50 pl-2 pr-2 py-1 mb-1.5 text-left">
                  {replyThumb(msg.replyTo)}
                  <span className="min-w-0">
                    <p className="font-semibold opacity-90 truncate">{msg.replyTo.senderName}</p>
                    <p className="line-clamp-1 opacity-75">{replyPreviewLabel(msg.replyTo)}</p>
                  </span>
                </button>
              )}

              {msg.mediaType === "image" && msg.mediaUrl && (
                <img src={msg.mediaUrl} alt="" onClick={() => onImageClick(msg.mediaUrl)} className="rounded-xl max-w-full max-h-64 object-cover cursor-zoom-in mb-1.5 -mx-0.5" />
              )}
              {msg.mediaType === "video" && msg.mediaUrl && (
                <div className="relative cursor-pointer mb-1.5" onClick={() => onVideoClick(msg.mediaUrl)}>
                  <video src={msg.mediaUrl} className="rounded-xl max-w-full max-h-64 object-cover pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center">
                      <div className="w-0 h-0 border-y-[8px] border-y-transparent border-l-[13px] border-l-white ml-1" />
                    </div>
                  </div>
                </div>
              )}
              {msg.mediaType === "voice" && msg.mediaUrl && (
                <audio src={msg.mediaUrl} controls className="max-w-full mb-1.5 h-10" style={{ minWidth: 220 }} />
              )}
              {msg.mediaType === "file" && msg.mediaUrl && (
                <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2 mb-1.5 hover:bg-black/30 transition">
                  {Icon.file}
                  <span className="text-sm truncate flex-1">{msg.fileName}</span>
                  <span className="text-[11px] opacity-70">{fmtSize(msg.fileSize || 0)}</span>
                </a>
              )}

              {msg.text && <p className="text-[15px] leading-snug whitespace-pre-wrap break-words">{msg.text}</p>}

              <div className="flex items-center justify-end mt-0.5">
                <TimePill overlay={false} />
              </div>

              {msg.reactions?.length > 0 && (
                <div className="absolute -bottom-3 right-2 z-10 bg-[#1c1c1e] border border-white/10 rounded-full px-1.5 py-0.5 flex gap-0.5 shadow">
                  {msg.reactions.slice(0, 3).map((r, i) => <span key={i} className="text-xs">{r.emoji}</span>)}
                  {msg.reactions.length > 3 && <span className="text-[10px] text-gray-400">+{msg.reactions.length - 3}</span>}
                </div>
              )}
            </div>
          )}

          {/* Desktop hover quick-actions (reply/react/delete) — long-press bhi kaam karta hai, ye sirf mouse-users ke liye extra convenience */}
          {!selectMode && !isSticker && (
            <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-24" : "-right-24"} hidden group-hover:md:flex items-center gap-1 bg-[#1c1c1e] border border-white/10 rounded-full px-1.5 py-1 shadow-lg`}>
              <button type="button" onClick={() => onReply(msg)} className="p-1 text-gray-400 hover:text-white transition">{Icon.reply}</button>
              <button
                type="button"
                onClick={() => (myReaction ? onRemoveReaction(msg._id) : setShowMenu(true))}
                className="p-1 text-gray-400 hover:text-white transition text-sm"
              >
                {myReaction ? myReaction.emoji : "🙂"}
              </button>
              {(isMe || canDeleteAny) && (
                <button type="button" onClick={() => setShowMenu(true)} className="p-1 text-gray-400 hover:text-red-400 transition">{Icon.trash}</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AttachMenu (single "+" button ab yahan se photo/video, document,
// sticker — teeno alag, scoped options kholta hai, WhatsApp jaisa) ────────
function AttachMenu({ onPickPhotoVideo, onPickDocument, onPickSticker, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const options = [
    { key: "media", label: "Photo / Video", icon: Icon.img, action: onPickPhotoVideo, color: "bg-purple-500/20 text-purple-300" },
    { key: "doc", label: "Document", icon: Icon.file, action: onPickDocument, color: "bg-blue-500/20 text-blue-300" },
    { key: "sticker", label: "Sticker", icon: <span className="text-lg leading-none">😀</span>, action: onPickSticker, color: "bg-amber-500/20 text-amber-300" },
  ];

  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 z-30 bg-[#1c1c1e] border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 min-w-[170px]">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => { opt.action(); onClose(); }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition text-left"
        >
          <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${opt.color}`}>{opt.icon}</span>
          <span className="text-sm font-medium">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── StickerPicker ───────────────────────────────────────────────────────
function StickerPicker({ stickers, onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 z-30 bg-[#1c1c1e] border border-white/10 rounded-2xl p-3 shadow-2xl w-64">
      <p className="text-xs text-gray-500 font-semibold mb-2">Stickers</p>
      {stickers.length === 0 ? (
        <p className="text-center text-gray-600 text-xs py-6">No stickers available</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {stickers.map((s) => (
            <button key={s.id} type="button" onClick={() => onPick(s.id)} className="aspect-square rounded-xl bg-white/5 hover:bg-white/10 transition flex items-center justify-center text-2xl">
              {s.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ChatMenu (3-dot header menu — role-aware) ──────────────────────────
// Spec (image-2 reference): sirf UI-scalable options rakhe hain —
// Add Member, Group Info, Clear Chat (mine), Exit/Delete Group. "Search",
// "Select messages", "Mute", "Disappearing messages", "Favorites",
// "Add to list" abhi backend-heavy hain — skip kiya hai jab tak backend
// support na ho, taaki dead/non-functional buttons UI me na dikhein.
function ChatMenu({ isAdminOrCreator, isCreator, isMuted, isFavorite, onAddMember, onGroupInfo, onSearch, onSelectMessages, onToggleMute, onToggleFavorite, onClearChat, onExitOrDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-full right-0 mt-1 z-30 bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[200px] text-sm max-h-[70vh] overflow-y-auto">
      {isAdminOrCreator && (
        <button type="button" onClick={() => { onAddMember(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-left">
          {Icon.userPlus || Icon.friends} Add Member
        </button>
      )}
      <button type="button" onClick={() => { onGroupInfo(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-left">
        {Icon.info || "ℹ️"} Group Info
      </button>
      <button type="button" onClick={() => { onSearch(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-left">
        {Icon.search || "🔍"} Search
      </button>
      <button type="button" onClick={() => { onSelectMessages(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-left">
        {Icon.check || "☑️"} Select Messages
      </button>
      <button type="button" onClick={() => { onToggleMute(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-left">
        {isMuted ? "🔔" : "🔕"} {isMuted ? "Unmute Notifications" : "Mute Notifications"}
      </button>
      <button type="button" onClick={() => { onToggleFavorite(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-left">
        {isFavorite ? "⭐" : "☆"} {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      </button>
      <button type="button" onClick={() => { onClearChat(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-left">
        {Icon.trash} Clear Chat
      </button>
      <div className="border-t border-white/10" />
      <button type="button" onClick={() => { onExitOrDelete(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-400 transition text-left">
        {Icon.back} {isCreator ? "Delete Group" : "Exit Group"}
      </button>
    </div>
  );
}

// ─── SearchPanel ─────────────────────────────────────────────────────────
function SearchPanel({ groupId, onClose, onJumpToResult }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await groupApi.searchGroupMessages(groupId, query.trim());
      setResults(res.results || []);
      setLoading(false);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, groupId]);

  return (
    <div className="fixed inset-0 z-[80] bg-navy-950 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-navy-900/50 flex-shrink-0">
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">{Icon.back}</button>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in this chat..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading && <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>}
        {!loading && query.trim() && results.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-12">No messages found</p>
        )}
        <div className="space-y-2">
          {results.map((r) => (
            <button
              key={r._id}
              type="button"
              onClick={() => onJumpToResult(r)}
              className="w-full text-left bg-white/[0.03] hover:bg-white/[0.06] rounded-xl px-3 py-2.5 transition"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-brand-400">@{r.sender?.username}</span>
                <span className="text-[10px] text-gray-600">{fmtTime(r.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2">{r.text || `📎 ${r.messageType}`}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AddMemberPicker ─────────────────────────────────────────────────────────
function AddMemberPicker({ communityMembers, existingMemberIds, onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const candidates = communityMembers.filter((m) => {
    if (existingMemberIds.has(String(m._id))) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return m.fullName?.toLowerCase().includes(q) || m.username?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#111] border border-white/10 rounded-3xl p-5 w-full max-w-sm max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-3">Add Members</h3>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search community members..."
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm mb-3 outline-none focus:border-brand-500"
        />
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {candidates.length === 0 && <p className="text-center text-gray-500 text-sm py-8">No members to add</p>}
          {candidates.map((m) => (
            <div key={m._id} className="flex items-center gap-2.5 bg-white/[0.03] rounded-xl px-3 py-2">
              <img src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName || "U")}&background=7c3aed&color=fff`} alt="" className="w-8 h-8 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{m.fullName}</p>
                <p className="text-[10px] text-gray-500 truncate">@{m.username}</p>
              </div>
              <button type="button" onClick={() => onAdd(m._id)} className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-full text-[11px] font-semibold transition">Add</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-3 w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition">Close</button>
      </div>
    </div>
  );
}

// ─── GroupProfileModal (management — opens on avatar/name tap) ─────────────
function GroupProfileModal({ group, myRole, myId, communityMembers, onClose, onUpdated, onLeftOrDeleted, showToast, autoOpenAddPicker }) {
  const isAdmin = myRole === "creator" || myRole === "admin";
  const isCreator = myRole === "creator";

  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(!!autoOpenAddPicker);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [messagePermission, setMessagePermission] = useState(group.messagePermission || "all");
  const [disappearingDuration, setDisappearingDuration] = useState(group.disappearingDuration || 0);
  const [busy, setBusy] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarUploading(true);
    const res = await groupApi.uploadGroupAvatar(group._id, file);
    setAvatarUploading(false);
    if (res.success) {
      showToast("Group photo updated");
      onUpdated(res.group);
    } else {
      showToast(res.msg || "Could not upload photo", "error");
    }
  };

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingMembers(true);
    const [memRes, reqRes] = await Promise.all([
      groupApi.getGroupMembers(group._id),
      groupApi.getJoinRequests(group._id),
    ]);
    setMembers(memRes.members || []);
    setJoinRequests(reqRes.requests || []);
    setLoadingMembers(false);
  }, [group._id, isAdmin]);

  useEffect(() => { loadAdminData(); }, [loadAdminData]);

  const handleSaveEdit = async () => {
    setBusy(true);
    const res = await groupApi.updateGroup(group._id, { name, description, messagePermission, disappearingDuration });
    setBusy(false);
    if (res.success) {
      showToast("Group updated");
      setEditing(false);
      onUpdated(res.group);
    } else {
      showToast(res.msg || "Could not update group", "error");
    }
  };

  const handleAddMember = async (userId) => {
    const res = await groupApi.addMemberDirect(group._id, userId);
    if (res.success) { showToast("Member added"); loadAdminData(); }
    else showToast(res.msg || "Could not add member", "error");
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this member from the group?")) return;
    const res = await groupApi.removeMember(group._id, userId);
    if (res.success) { showToast("Member removed"); loadAdminData(); }
    else showToast(res.msg || "Could not remove member", "error");
  };

  const handlePromote = async (userId) => {
    const res = await groupApi.promoteToAdmin(group._id, userId);
    if (res.success) { showToast("Promoted to admin"); loadAdminData(); }
    else showToast(res.msg || "Could not promote", "error");
  };

  const handleDemote = async (userId) => {
    const res = await groupApi.demoteAdmin(group._id, userId);
    if (res.success) { showToast("Demoted to member"); loadAdminData(); }
    else showToast(res.msg || "Could not demote", "error");
  };

  const handleRespondRequest = async (requestId, action) => {
    const res = await groupApi.respondToJoinRequest(group._id, requestId, action);
    if (res.success) { showToast(action === "accept" ? "Request accepted" : "Request declined"); loadAdminData(); }
    else showToast(res.msg || "Could not respond", "error");
  };

  const handleLeave = async () => {
    if (!window.confirm(`Leave "${group.name}"?`)) return;
    const res = await groupApi.leaveGroup(group._id);
    if (res.success) { showToast("Left group"); onLeftOrDeleted(); }
    else showToast(res.msg || "Could not leave group", "error");
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${group.name}" permanently? This removes all chats and media for everyone.`)) return;
    const res = await groupApi.deleteGroup(group._id);
    if (res.success) { showToast("Group deleted"); onLeftOrDeleted(); }
    else showToast(res.msg || "Could not delete group", "error");
  };

  const existingMemberIds = new Set(members.map((m) => String(m.userId?._id)));

  return (
    <div className="fixed inset-0 z-[60] bg-navy-950 flex flex-col">
      {/* Back-arrow header — full screen mobile-nav pattern, not a floating X */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-navy-900/50 flex-shrink-0">
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition p-1 -ml-1">{Icon.back}</button>
        <h3 className="text-base font-bold">Group Info</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 max-w-lg w-full mx-auto">
        <div className="flex flex-col items-center text-center mb-5">
          <button
            type="button"
            onClick={() => isAdmin && avatarInputRef.current?.click()}
            className={`relative w-20 h-20 rounded-2xl overflow-hidden bg-brand-600 flex items-center justify-center text-2xl font-extrabold group/avatar ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
          >
            {group.avatar ? <img src={group.avatar} alt="" className="w-full h-full object-cover" /> : group.name?.[0]?.toUpperCase() || "G"}
            {isAdmin && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-[10px] font-semibold transition">
                {avatarUploading ? "Uploading…" : "Change"}
              </div>
            )}
          </button>
          {isAdmin && <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />}

          {editing ? (
            <div className="w-full mt-3 space-y-2 text-left">
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="Group name" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 resize-none" placeholder="Description" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Who can send messages?</p>
                <select value={messagePermission} onChange={(e) => setMessagePermission(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500">
                  <option value="all">Everyone</option>
                  <option value="admins_only">Only Admins</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Disappearing messages</p>
                <select value={disappearingDuration} onChange={(e) => setDisappearingDuration(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500">
                  <option value={0}>Off</option>
                  <option value={86400}>24 hours</option>
                  <option value={604800}>7 days</option>
                  <option value={7776000}>90 days</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={handleSaveEdit} className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
                <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h4 className="text-xl font-bold mt-3">{group.name}</h4>
              {group.description && <p className="text-gray-500 text-sm mt-1">{group.description}</p>}
              <p className="text-xs text-gray-600 mt-2">{group.memberCount} / {group.maxMembers} members · {group.messagePermission === "admins_only" ? "Only admins can chat" : "Everyone can chat"}{group.disappearingDuration ? " · ⏱ Disappearing on" : ""}</p>
              {isAdmin && (
                <button type="button" onClick={() => setEditing(true)} className="mt-3 text-xs text-brand-400 hover:text-brand-300 font-semibold transition">Edit Group Info</button>
              )}
            </>
          )}
        </div>

        {isAdmin && (
          <>
            {joinRequests.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Join Requests ({joinRequests.length})</p>
                <div className="space-y-1.5">
                  {joinRequests.map((r) => (
                    <div key={r._id} className="flex items-center gap-2.5 bg-white/[0.03] rounded-xl px-3 py-2">
                      <img src={r.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.userId?.username || "U")}&background=7c3aed&color=fff`} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <p className="flex-1 text-xs font-medium truncate">@{r.userId?.username}</p>
                      <button type="button" onClick={() => handleRespondRequest(r._id, "accept")} className="px-2.5 py-1 bg-green-600/20 text-green-400 border border-green-500/30 rounded-full text-[11px] font-semibold hover:bg-green-600/40 transition">Accept</button>
                      <button type="button" onClick={() => handleRespondRequest(r._id, "decline")} className="px-2.5 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full text-[11px] font-semibold hover:bg-red-600/40 transition">Decline</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members ({members.length})</p>
                <button type="button" onClick={() => setShowAddPicker(true)} className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition">+ Add</button>
              </div>
              {loadingMembers ? (
                <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {members.map((m) => (
                    <div key={m._id} className="flex items-center gap-2.5 bg-white/[0.03] rounded-xl px-3 py-2">
                      <img src={m.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.userId?.username || "U")}&background=7c3aed&color=fff`} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">@{m.userId?.username}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{m.role}</p>
                      </div>
                      {isCreator && m.role === "member" && (
                        <button type="button" onClick={() => handlePromote(m.userId?._id)} className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold px-1.5">Make Admin</button>
                      )}
                      {isCreator && m.role === "admin" && (
                        <button type="button" onClick={() => handleDemote(m.userId?._id)} className="text-[10px] text-yellow-400 hover:text-yellow-300 font-semibold px-1.5">Demote</button>
                      )}
                      {m.role !== "creator" && (isCreator || m.role === "member") && (
                        <button type="button" onClick={() => handleRemoveMember(m.userId?._id)} className="text-gray-500 hover:text-red-400 transition px-1">{Icon.x}</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="pt-3 border-t border-white/10">
          {isCreator ? (
            <button type="button" onClick={handleDelete} className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl text-sm font-semibold transition">Delete Group</button>
          ) : (
            <button type="button" onClick={handleLeave} className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl text-sm font-semibold transition">Leave Group</button>
          )}
        </div>
      </div>

      {showAddPicker && (
        <AddMemberPicker
          communityMembers={communityMembers}
          existingMemberIds={existingMemberIds}
          onAdd={(userId) => { handleAddMember(userId); setShowAddPicker(false); }}
          onClose={() => setShowAddPicker(false)}
        />
      )}
    </div>
  );
}
// ─── MAIN: GroupChatPanel ───────────────────────────────────────────────────
export default function GroupChatPanel({ group: initialGroup, myRole: initialMyRole, communityMembers = [], onClose, showToast: parentShowToast }) {
  const { user } = useContext(AuthContext);
  const myId = user?._id || user?.id;

  const [group, setGroup] = useState(initialGroup);
  const [myRole, setMyRole] = useState(initialMyRole);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [autoOpenAddPicker, setAutoOpenAddPicker] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isMuted, setIsMuted] = useState(initialGroup.isMuted || false);
  const [isFavorite, setIsFavorite] = useState(initialGroup.isFavorite || false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [enlargedVideo, setEnlargedVideo] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [chatZoom, setChatZoom] = useState(1);
  const pinchStartDistRef = useRef(null);
  const pinchStartZoomRef = useRef(1);

  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  // "Chatpage ko hi zoom in/out karne ka option do" — do-ungli pinch se
  // poore message-area ka zoom badhta/ghatata hai (0.8x - 1.8x clamp).
  const handlePinchStart = (e) => {
    if (e.touches.length === 2) {
      pinchStartDistRef.current = getTouchDistance(e.touches);
      pinchStartZoomRef.current = chatZoom;
    }
  };
  const handlePinchMove = (e) => {
    if (e.touches.length === 2 && pinchStartDistRef.current) {
      const newDist = getTouchDistance(e.touches);
      const ratio = newDist / pinchStartDistRef.current;
      const next = Math.max(0.8, Math.min(1.8, pinchStartZoomRef.current * ratio));
      setChatZoom(next);
    }
  };
  const handlePinchEnd = (e) => {
    if (e.touches.length < 2) pinchStartDistRef.current = null;
  };
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineCount, setOnlineCount] = useState(0);
  const [localToast, setLocalToast] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [stickerPack, setStickerPack] = useState([]);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const photoVideoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const micStreamRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const typingTimer = useRef(null);
  const sendingRef = useRef(false); // double-send guard (see handleSend)

  const showToast = parentShowToast || ((msg, type) => {
    setLocalToast({ msg, type });
    setTimeout(() => setLocalToast(null), 3000);
  });

  const isAdminOrCreator = myRole === "creator" || myRole === "admin";
  const canDeleteAny = isAdminOrCreator;
  const stickerMap = Object.fromEntries(stickerPack.map((s) => [s.id, s.emoji]));

  // ── Load messages + group context ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPage(1);
      setHasMore(true);
      const [msgRes, grpRes, onlineRes] = await Promise.all([
        groupApi.getGroupMessages(group._id, 1),
        groupApi.getGroupById(group._id),
        groupApi.getOnlineGroupMembers(group._id),
      ]);
      if (cancelled) return;
      const firstPage = msgRes.messages || [];
      setMessages(firstPage.slice().reverse()); // service returns newest-first, we render oldest->newest
      setHasMore(firstPage.length >= 50); // ek pura page mila -> aur purane messages ho sakte hain
      if (grpRes.success) { setGroup(grpRes.group); setMyRole(grpRes.myRole); setIsMuted(grpRes.isMuted); setIsFavorite(grpRes.isFavorite); }
      setOnlineCount((onlineRes.members || []).filter((m) => m.isOnline).length);
      setLoading(false);
      groupApi.markGroupMessagesSeen(group._id);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group._id]);

  // ── Infinite scroll — scroll-to-top pe purane messages load karo ───────
  // Scroll position preserve karte hain (naya content upar prepend hone se
  // viewport "jump" na kare — scrollHeight ka difference measure karke
  // scrollTop adjust karte hain).
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const container = messageListRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await groupApi.getGroupMessages(group._id, nextPage);
    const older = (res.messages || []).slice().reverse();

    if (older.length > 0) {
      isPrependingRef.current = true;
      setMessages((prev) => [...older, ...prev]);
      setPage(nextPage);
    }
    setHasMore(older.length >= 50);
    setLoadingMore(false);

    // DOM update ke baad scroll position restore karo
    requestAnimationFrame(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - prevScrollHeight;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group._id, page, hasMore, loadingMore]);

  const handleMessageListScroll = (e) => {
    if (e.target.scrollTop < 80) loadMoreMessages();
  };

  useEffect(() => {
    groupApi.getStickerPack().then(setStickerPack);
  }, []);

  const isPrependingRef = useRef(false);

  useEffect(() => {
    if (isPrependingRef.current) { isPrependingRef.current = false; return; }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Socket real-time ──────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    socket.emit("join_room", { roomType: "group", roomId: group._id });

    const onMessage = (msg) => {
      if (String(msg.groupId) !== String(group._id)) return;
      setMessages((prev) => [...prev, msg]);
      groupApi.markGroupMessagesSeen(group._id);
    };
    const onDeletedForAll = ({ messageId, groupId }) => {
      if (String(groupId) !== String(group._id)) return;
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, isDeletedForEveryone: true } : m)));
    };
    const onReaction = ({ messageId, groupId, userId, emoji }) => {
      if (String(groupId) !== String(group._id)) return;
      setMessages((prev) => prev.map((m) => {
        if (m._id !== messageId) return m;
        const reactions = (m.reactions || []).filter((r) => String(r.userId) !== String(userId));
        reactions.push({ userId, emoji });
        return { ...m, reactions };
      }));
    };
    const onReactionRemoved = ({ messageId, groupId, userId }) => {
      if (String(groupId) !== String(group._id)) return;
      setMessages((prev) => prev.map((m) => (
        m._id === messageId ? { ...m, reactions: (m.reactions || []).filter((r) => String(r.userId) !== String(userId)) } : m
      )));
    };
    const onTyping = ({ username, groupId }) => {
      if (String(groupId) !== String(group._id)) return;
      setTypingUsers((prev) => new Set([...prev, username]));
    };
    const onStopTyping = ({ groupId }) => {
      if (String(groupId) !== String(group._id)) return;
      setTypingUsers(new Set());
    };

    socket.on("receive_group_message", onMessage);
    socket.on("group_message_deleted_for_all", onDeletedForAll);
    socket.on("group_message_reaction", onReaction);
    socket.on("group_message_reaction_removed", onReactionRemoved);
    socket.on("group_user_typing", onTyping);
    socket.on("group_user_stopped_typing", onStopTyping);

    return () => {
      socket.emit("leave_group_room", { groupId: group._id });
      socket.off("receive_group_message", onMessage);
      socket.off("group_message_deleted_for_all", onDeletedForAll);
      socket.off("group_message_reaction", onReaction);
      socket.off("group_message_reaction_removed", onReactionRemoved);
      socket.off("group_user_typing", onTyping);
      socket.off("group_user_stopped_typing", onStopTyping);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group._id]);

  const handleTyping = (val) => {
    setText(val);
    const socket = getSocket();
    socket.emit("group_typing_start", { groupId: group._id, username: user?.username || String(myId) });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit("group_typing_stop", { groupId: group._id }), 2000);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // FIX (double message bug): pehle koi guard nahi tha — mobile keyboards
    // "Enter"/"Go" ke liye kabhi kabhi keydown event 2 baar fire karte hain,
    // aur async call ke complete hone se pehle text/replyingTo clear nahi
    // hote the, isliye dusra Enter/click firing wahi text+reply dobara bhej
    // deta tha -> 2 alag messages ban jaate the. Ab sendingRef se turant
    // (synchronously) re-entry block karte hain, aur input turant clear
    // karte hain call jaane se pehle hi.
    if (sendingRef.current) return;
    sendingRef.current = true;

    const replyToId = replyingTo?._id;
    setText("");
    setReplyingTo(null);

    const res = await groupApi.sendGroupMessage(group._id, trimmed, replyToId);
    sendingRef.current = false;

    if (!res.success) {
      showToast(res.msg || "Could not send message", "error");
      setText(trimmed); // restore so user doesn't lose what they typed
    }
  };

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const res = await groupApi.sendGroupMediaMessage(group._id, file);
    if (!res.success) showToast(res.msg || "Could not send file", "error");
  };

  // ── Voice recording (live mic — MediaRecorder API) ───────────────────
  // Codec chosen by browser support: Chrome/Android -> audio/webm,
  // Safari/iOS -> audio/mp4. Backend (S3.config.js allowedMimeTypes.audio)
  // now accepts both, plus common Android variants (aac/3gpp/m4a).
  const pickSupportedMimeType = () => {
    const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
    for (const type of candidates) {
      if (window.MediaRecorder?.isTypeSupported?.(type)) return type;
    }
    return ""; // let the browser pick a default
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast("Voice recording is not supported on this browser", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const mimeType = pickSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);
      recordingIntervalRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (err) {
      showToast("Microphone permission denied", "error");
    }
  };

  const stopMicAndTimer = () => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    clearInterval(recordingIntervalRef.current);
    setRecording(false);
  };

  const stopRecordingAndSend = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    const duration = recordingSeconds;

    recorder.onstop = async () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
      const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: mimeType });

      const res = await groupApi.sendGroupMediaMessage(group._id, file, { isVoice: true, duration });
      if (!res.success) showToast(res.msg || "Could not send voice message", "error");
    };

    recorder.stop();
    stopMicAndTimer();
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      recorder.onstop = null; // discard — koi upload nahi
      if (recorder.state !== "inactive") recorder.stop();
    }
    audioChunksRef.current = [];
    stopMicAndTimer();
  };

  // Unmount pe agar recording chal rahi ho to mic band karo (leak-safe)
  useEffect(() => () => { micStreamRef.current?.getTracks().forEach((t) => t.stop()); clearInterval(recordingIntervalRef.current); }, []);

  const handleSendSticker = async (stickerId) => {
    setShowStickerPicker(false);
    const res = await groupApi.sendGroupSticker(group._id, stickerId);
    if (!res.success) showToast(res.msg || "Could not send sticker", "error");
  };

  const handleClearChat = async () => {
    if (!window.confirm("Clear all messages? This only clears the chat for you — others will still see it.")) return;
    const res = await groupApi.clearChatForMe(group._id);
    if (res.success) {
      setMessages([]);
      setHasMore(false);
      showToast("Chat cleared");
    } else {
      showToast(res.msg || "Could not clear chat", "error");
    }
  };

  const handleExitOrDeleteFromMenu = async () => {
    if (isAdminOrCreator && myRole === "creator") {
      if (!window.confirm(`Delete "${group.name}" permanently? This removes all chats and media for everyone.`)) return;
      const res = await groupApi.deleteGroup(group._id);
      if (res.success) { showToast("Group deleted"); onClose(); }
      else showToast(res.msg || "Could not delete group", "error");
    } else {
      if (!window.confirm(`Leave "${group.name}"?`)) return;
      const res = await groupApi.leaveGroup(group._id);
      if (res.success) { showToast("Left group"); onClose(); }
      else showToast(res.msg || "Could not leave group", "error");
    }
  };

  // ── Select-messages mode (bulk delete) ────────────────────────────────
  const handleToggleSelect = (messageId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const handleBulkDeleteMe = async () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    const res = await groupApi.bulkDeleteForMe(group._id, ids);
    if (res.success) {
      setMessages((prev) => prev.filter((m) => !ids.includes(m._id)));
      showToast(`${res.deletedCount} message(s) deleted`);
      exitSelectMode();
    } else {
      showToast(res.msg || "Could not delete messages", "error");
    }
  };

  const handleBulkDeleteAll = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} message(s) for everyone?`)) return;
    const ids = [...selectedIds];
    const res = await groupApi.bulkDeleteForAll(group._id, ids);
    if (res.success) {
      showToast(`${res.deletedCount} deleted${res.skippedCount ? `, ${res.skippedCount} skipped (not yours)` : ""}`);
      exitSelectMode();
    } else {
      showToast(res.msg || "Could not delete messages", "error");
    }
  };

  const handleToggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next); // optimistic
    const res = await groupApi.toggleMuteGroup(group._id, next);
    if (!res.success) { setIsMuted(!next); showToast(res.msg || "Could not update", "error"); }
    else showToast(next ? "Notifications muted" : "Notifications unmuted");
  };

  const handleToggleFavorite = async () => {
    const next = !isFavorite;
    setIsFavorite(next); // optimistic
    const res = await groupApi.toggleFavoriteGroup(group._id, next);
    if (!res.success) { setIsFavorite(!next); showToast(res.msg || "Could not update", "error"); }
    else showToast(next ? "Added to favorites" : "Removed from favorites");
  };

  // Real jump-to-message: agar target already loaded hai to seedha scroll +
  // highlight-flash; agar nahi hai to purane pages progressively load karte
  // hain (max 8 tries) jab tak mil na jaye ya server pe aur na bache.
  const jumpToMessageId = async (targetId) => {
    let el = document.getElementById(`msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(targetId);
      setTimeout(() => setHighlightedMessageId(null), 1600);
      return;
    }

    let currentPage = page;
    let moreAvailable = hasMore;
    const container = messageListRef.current;
    let found = false;

    for (let attempt = 0; attempt < 8 && !found && moreAvailable; attempt++) {
      const prevScrollHeight = container?.scrollHeight || 0;
      currentPage += 1;
      const res = await groupApi.getGroupMessages(group._id, currentPage);
      const older = (res.messages || []).slice().reverse();
      if (older.length === 0) { moreAvailable = false; break; }

      isPrependingRef.current = true;
      setMessages((prev) => [...older, ...prev]);
      setPage(currentPage);
      moreAvailable = older.length >= 50;
      setHasMore(moreAvailable);

      await new Promise((r) => setTimeout(r, 60)); // React ko DOM commit karne dena
      if (container) container.scrollTop = container.scrollHeight - prevScrollHeight;

      el = document.getElementById(`msg-${targetId}`);
      if (el) found = true;
    }

    if (found && el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(targetId);
      setTimeout(() => setHighlightedMessageId(null), 1600);
    } else {
      showToast("Could not locate that message (too old)", "error");
    }
  };

  const handleJumpToReply = (messageId) => jumpToMessageId(messageId);
  const handleJumpToResult = (result) => { setShowSearch(false); jumpToMessageId(result._id); };

  const handleDeleteMe = async (messageId) => {
    const res = await groupApi.deleteGroupMessageForMe(group._id, messageId);
    if (res.success) setMessages((prev) => prev.filter((m) => m._id !== messageId));
    else showToast(res.msg || "Could not delete message", "error");
  };

  const handleDeleteAll = async (messageId) => {
    const res = await groupApi.deleteGroupMessageForAll(group._id, messageId);
    if (!res.success) showToast(res.msg || "Could not delete message", "error");
  };

  const handleReact = async (messageId, emoji) => {
    const res = await groupApi.reactToGroupMessage(group._id, messageId, emoji);
    if (!res.success) showToast(res.msg || "Could not react", "error");
  };

  const handleRemoveReaction = async (messageId) => {
    const res = await groupApi.removeGroupMessageReaction(group._id, messageId);
    if (!res.success) showToast(res.msg || "Could not remove reaction", "error");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-navy-950 flex flex-col">
      {localToast && <div className={`fixed top-4 right-4 z-[200] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg ${localToast.type === "error" ? "bg-red-600" : "bg-green-600"} text-white`}>{localToast.msg}</div>}

      {/* Header — tapping avatar/name opens Group Info (management) */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-navy-900/50 flex-shrink-0 relative">
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">{Icon.back}</button>
        <button type="button" onClick={() => setShowProfile(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {group.avatar ? <img src={group.avatar} alt="" className="w-full h-full object-cover" /> : group.name?.[0]?.toUpperCase() || "G"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{group.name}</p>
            <p className="text-[11px] text-gray-500 truncate">
              {typingUsers.size > 0 ? <span className="text-brand-400">{[...typingUsers].join(", ")} typing…</span> : `${group.memberCount} members${onlineCount > 0 ? ` · ${onlineCount} online` : ""}`}
            </p>
          </div>
        </button>

        <button type="button" onClick={() => setShowChatMenu((s) => !s)} className="p-2 text-gray-400 hover:text-white transition flex-shrink-0">{Icon.more || "⋮"}</button>
        {showChatMenu && (
          <ChatMenu
            isAdminOrCreator={isAdminOrCreator}
            isCreator={myRole === "creator"}
            isMuted={isMuted}
            isFavorite={isFavorite}
            onAddMember={() => { setAutoOpenAddPicker(true); setShowProfile(true); }}
            onGroupInfo={() => { setAutoOpenAddPicker(false); setShowProfile(true); }}
            onSearch={() => setShowSearch(true)}
            onSelectMessages={() => setSelectMode(true)}
            onToggleMute={handleToggleMute}
            onToggleFavorite={handleToggleFavorite}
            onClearChat={handleClearChat}
            onExitOrDelete={handleExitOrDeleteFromMenu}
            onClose={() => setShowChatMenu(false)}
          />
        )}
      </div>

      {/* Select-mode toolbar (replaces normal header info while active) */}
      {selectMode && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-brand-600/10 border-b border-brand-500/20 flex-shrink-0">
          <button type="button" onClick={exitSelectMode} className="text-sm text-gray-300 hover:text-white transition">{Icon.x} Cancel</button>
          <span className="text-sm font-semibold text-brand-300">{selectedIds.size} selected</span>
        </div>
      )}

      {/* Messages */}
      <div ref={messageListRef} onScroll={handleMessageListScroll} className="flex-1 overflow-y-auto px-4 py-4">
        {loadingMore && (
          <div className="flex justify-center py-2"><div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        )}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-16">No messages yet. Say hi 👋</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isMe={String(msg.sender?._id) === String(myId)}
              canDeleteAny={canDeleteAny}
              myId={myId}
              onDeleteMe={handleDeleteMe}
              onDeleteAll={handleDeleteAll}
              onReact={handleReact}
              onRemoveReaction={handleRemoveReaction}
              onReply={setReplyingTo}
              onImageClick={setEnlargedImage}
              onVideoClick={setEnlargedVideo}
              onJumpToReply={handleJumpToReply}
              highlighted={highlightedMessageId === msg._id}
              stickerMap={stickerMap}
              selectMode={selectMode}
              isSelected={selectedIds.has(msg._id)}
              onToggleSelect={handleToggleSelect}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Select-mode bulk-action bar (replaces input bar while active) */}
      {selectMode ? (
        <div className="border-t border-white/10 bg-navy-900/50 px-4 py-3 flex-shrink-0 flex items-center gap-2">
          <button type="button" disabled={selectedIds.size === 0} onClick={handleBulkDeleteMe} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 rounded-xl text-sm font-medium transition">Delete for me</button>
          <button type="button" disabled={selectedIds.size === 0} onClick={handleBulkDeleteAll} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-300 rounded-xl text-sm font-semibold transition">Delete for everyone</button>
        </div>
      ) : (
      <>
      {/* Input bar */}
      <div className="border-t border-white/10 bg-navy-900/50 px-4 py-3 flex-shrink-0">
        {replyingTo && (
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 mb-2 text-xs">
            <span className="text-gray-400 truncate">Replying to: {replyingTo.text || "media"}</span>
            <button type="button" onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-white">{Icon.x}</button>
          </div>
        )}
        {!isAdminOrCreator && group.messagePermission === "admins_only" ? (
          <p className="text-center text-xs text-gray-500 py-2">Only group admins can send messages here</p>
        ) : recording ? (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2.5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-sm text-red-300 font-mono flex-1">{fmtDuration(recordingSeconds)}</span>
            <button type="button" onClick={cancelRecording} className="p-1.5 text-gray-400 hover:text-white transition flex-shrink-0" title="Cancel">{Icon.x}</button>
            <button type="button" onClick={stopRecordingAndSend} className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-full transition flex-shrink-0" title="Send">{Icon.send2}</button>
          </div>
        ) : (
          <div className="flex items-center gap-2 relative">
            {/* Hidden file inputs — separate, scoped `accept` per media kind */}
            <input ref={photoVideoInputRef} type="file" className="hidden" onChange={handleFilePick} accept="image/*,video/*" />
            <input ref={documentInputRef} type="file" className="hidden" onChange={handleFilePick} accept=".pdf,.doc,.docx,.txt,.zip,.ppt,.pptx,.xls,.xlsx" />

            <button type="button" onClick={() => setShowAttachMenu((s) => !s)} className="p-2.5 text-gray-400 hover:text-white transition flex-shrink-0">{Icon.attach}</button>

            {showAttachMenu && (
              <AttachMenu
                onClose={() => setShowAttachMenu(false)}
                onPickPhotoVideo={() => photoVideoInputRef.current?.click()}
                onPickDocument={() => documentInputRef.current?.click()}
                onPickSticker={() => setShowStickerPicker(true)}
              />
            )}
            {showStickerPicker && (
              <StickerPicker stickers={stickerPack} onPick={handleSendSticker} onClose={() => setShowStickerPicker(false)} />
            )}

            <input
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend(); } }}
              placeholder="Message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />

            {text.trim() ? (
              <button type="button" onClick={handleSend} className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-full transition flex-shrink-0">{Icon.send2}</button>
            ) : (
              <button type="button" onClick={startRecording} className="p-2.5 text-gray-400 hover:text-white transition flex-shrink-0" title="Record voice message">{Icon.mic}</button>
            )}
          </div>
        )}
      </div>
      </>
      )}

      {showSearch && (
        <SearchPanel groupId={group._id} onClose={() => setShowSearch(false)} onJumpToResult={handleJumpToResult} />
      )}

      {showProfile && (
        <GroupProfileModal
          group={group}
          myRole={myRole}
          myId={myId}
          communityMembers={communityMembers}
          autoOpenAddPicker={autoOpenAddPicker}
          onClose={() => { setShowProfile(false); setAutoOpenAddPicker(false); }}
          onUpdated={(updatedGroup) => setGroup(updatedGroup)}
          onLeftOrDeleted={() => { setShowProfile(false); onClose(); }}
          showToast={showToast}
        />
      )}

      {enlargedImage && <ImageModal src={enlargedImage} name={group.name} onClose={() => setEnlargedImage(null)} />}

      {enlargedVideo && (
        <div className="fixed inset-0 z-[150] bg-black flex items-center justify-center" onClick={() => setEnlargedVideo(null)}>
          <button type="button" onClick={() => setEnlargedVideo(null)} className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2">{Icon.x}</button>
          <video src={enlargedVideo} controls autoPlay className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}