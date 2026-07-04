// src/pages/CommunityView.jsx
// FIXES:
// 1. GetMessagesPipe — mediaUrl/mediaType/fileName/fileSize/duration project nahi thi → media disappear hota tha on reload
// 2. Android keyboard — send ke baad input blur ho jaata tha → readOnly trick fix
// 3. Typing indicator — socket event name "typing_start"/"typing_stop" fix
// 4. MediaGallery — user name click pe saara media (img/video/file) dikhega
// 5. Smart links — URL aur email clickable honge message bubble mein
// 6. Swipe to reply — left swipe se reply trigger
// 7. Last active text — header mein sahi dikhega
// 8. showVoice state missing tha sendVoice mein — fix kiya

import {
  useEffect, useState, useRef, useCallback,
  useContext, useMemo
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { getSocket } from "../lib/socket";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = {
  users:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  friends: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  inbox:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  send2:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  chat:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  feed:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  suggest: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>,
  x:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  back:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><polyline points="15 18 9 12 15 6"/></svg>,
  shop:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  info:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  emoji:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  attach:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  reply:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>,
  trash:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  img:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  file:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>,
  seendbl: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3"><polyline points="18 7 9.5 15.5 6 12"/><polyline points="22 7 13.5 15.5 10 12"/></svg>,
  mic:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
  stop:    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>,
  play:    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  pause:   <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  gallery: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  link:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3 h-3"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

const EMOJI_LIST = [
  "😀","😂","😍","🥰","😎","😭","😅","🤣","😊","😇",
  "🥳","😤","😴","🤔","😏","😬","🤯","🥺","😢","😡",
  "👍","👎","👏","🙌","🤝","🫶","❤️","🔥","✨","💯",
  "🎉","🎊","🙏","💪","🫠","😮","😱","🤩","😜","😈",
  "🌹","🌸","🍕","🎵","⚽","🏀","🎮","💻","📱","🚀",
  "👀","💀","🫡","🤌","🧠","💬","📸","🌈","⭐","🦋",
];

// ─── RoleBadge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const map = { owner:"bg-yellow-500/20 text-yellow-300 border-yellow-500/30", principal:"bg-blue-500/20 text-blue-300 border-blue-500/30", hod:"bg-teal-500/20 text-teal-300 border-teal-500/30", teacher:"bg-green-500/20 text-green-300 border-green-500/30", student:"bg-purple-500/20 text-purple-300 border-purple-500/30" };
  if (!role) return null;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${map[role] || map.student}`}>{role}</span>;
};

// ─── ImageModal ───────────────────────────────────────────────────────────────
function ImageModal({ src, name, onClose }) {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <img src={src} alt={name} className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

// ─── EmojiPicker ─────────────────────────────────────────────────────────────
function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute bottom-14 left-0 z-50 bg-[#1c1c1e] border border-white/10 rounded-2xl p-3 shadow-2xl w-72">
      <div className="grid grid-cols-10 gap-1">
        {EMOJI_LIST.map((em) => (
          <button key={em} type="button" onClick={() => onSelect(em)} className="text-xl hover:bg-white/10 rounded-lg p-0.5 transition leading-none">{em}</button>
        ))}
      </div>
    </div>
  );
}

// ─── VoicePlayer ─────────────────────────────────────────────────────────────
function VoicePlayer({ src, duration: initialDuration }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed,  setElapsed]  = useState(0);
  const audioRef = useRef(null);
  const fmtSecs  = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); } else { a.play(); setPlaying(true); }
  };
  return (
    <div className="flex items-center gap-2 px-3 py-2 min-w-[200px]">
      <audio ref={audioRef} src={src}
        onTimeUpdate={(e) => { const a = e.target; setElapsed(a.currentTime); setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0); }}
        onEnded={() => { setPlaying(false); setProgress(0); setElapsed(0); }} />
      <button type="button" onClick={toggle} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition">
        {playing ? Icon.pause : Icon.play}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-white/60 mt-0.5 text-right">{playing ? fmtSecs(elapsed) : fmtSecs(initialDuration || 0)}</p>
      </div>
    </div>
  );
}

// ─── VoiceRecorder ────────────────────────────────────────────────────────────
function VoiceRecorder({ onSend, onCancel, disabled }) {
  const [recording, setRecording] = useState(false);
  const [seconds,   setSeconds]   = useState(0);
  const [blobUrl,   setBlobUrl]   = useState(null);
  const [blob,      setBlob]      = useState(null);
  const recorderRef = useRef(null);
  const timerRef    = useRef(null);
  const chunksRef   = useRef([]);
  const fmtSecs = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: "audio/webm" });
        setBlob(b); setBlobUrl(URL.createObjectURL(b));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start(); recorderRef.current = mr;
      setRecording(true); setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch { alert("Microphone access nahi mila."); }
  };
  const stopRec = () => { recorderRef.current?.stop(); setRecording(false); clearInterval(timerRef.current); };
  const cleanup = () => { if (blobUrl) URL.revokeObjectURL(blobUrl); setBlobUrl(null); setBlob(null); setSeconds(0); setRecording(false); };
  useEffect(() => () => { clearInterval(timerRef.current); if (blobUrl) URL.revokeObjectURL(blobUrl); }, []); // eslint-disable-line

  return (
    <div className="mx-3 mb-1 px-3 py-2 bg-[#1c1c1e] border border-white/10 rounded-2xl flex items-center gap-3 flex-shrink-0">
      {!blobUrl ? (
        <>
          <button type="button" onClick={recording ? stopRec : startRec} disabled={disabled}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition flex-shrink-0 ${recording ? "bg-red-600 hover:bg-red-500 animate-pulse" : "bg-purple-600 hover:bg-purple-500"}`}>
            {recording ? Icon.stop : Icon.mic}
          </button>
          <div className="flex-1">
            {recording
              ? <div className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/><span className="text-sm font-mono text-red-400">{fmtSecs(seconds)}</span></div>
              : <p className="text-sm text-gray-400">Mic press karo record karne ke liye</p>}
          </div>
          <button type="button" onClick={() => { cleanup(); onCancel(); }} className="text-gray-500 hover:text-white flex-shrink-0">{Icon.x}</button>
        </>
      ) : (
        <>
          <VoicePlayer src={blobUrl} duration={seconds} />
          <div className="flex gap-2 flex-shrink-0">
            <button type="button" onClick={cleanup} className="w-8 h-8 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full flex items-center justify-center hover:bg-red-600/40 transition">{Icon.trash}</button>
            <button type="button" onClick={() => { onSend(blob, seconds); cleanup(); }} className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-500 transition">{Icon.send2}</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── FIX #5: Smart text renderer — URLs aur emails clickable banata hai ───────
function SmartText({ text }) {
  if (!text) return null;
  // URL aur email detect karo
  const parts = text.split(/(https?:\/\/[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
  return (
    <p className="px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap text-white">
      {parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
          return <a key={i} href={part} target="_blank" rel="noreferrer" className="underline text-purple-300 hover:text-purple-200 inline-flex items-center gap-0.5">{Icon.link}{part}</a>;
        }
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part)) {
          return <a key={i} href={`mailto:${part}`} className="underline text-blue-300 hover:text-blue-200">{part}</a>;
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

// ─── MsgMenu ──────────────────────────────────────────────────────────────────
function MsgMenu({ msg, isMine, onReply, onDeleteMe, onDeleteAll, onReact, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  const QUICK = ["❤️","😂","👍","😮","😢","🔥"];
  return (
    <div ref={ref} className={`absolute z-50 bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[180px] ${isMine ? "right-0" : "left-0"}`} style={{ bottom: "calc(100% + 6px)" }}>
      <div className="flex gap-1 px-3 py-2 border-b border-white/5">
        {QUICK.map((em) => <button key={em} type="button" onClick={() => { onReact(em); onClose(); }} className="text-lg hover:bg-white/10 rounded-lg p-1 transition">{em}</button>)}
      </div>
      <button type="button" onClick={() => { onReply(msg); onClose(); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition text-left">{Icon.reply} Reply</button>
      <button type="button" onClick={() => { onDeleteMe(msg._id); onClose(); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition text-left">{Icon.trash} Delete for me</button>
      {isMine && <button type="button" onClick={() => { onDeleteAll(msg._id); onClose(); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-white/5 transition text-left border-t border-white/5">{Icon.trash} Delete for everyone</button>}
    </div>
  );
}

// ─── FIX #6: MessageBubble with swipe-to-reply ───────────────────────────────
function MessageBubble({ msg, isMine, myId, onReply, onDeleteMe, onDeleteAll, onImageClick }) {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [reaction,  setReaction]  = useState(msg.reaction || null);
  const [swipeX,    setSwipeX]    = useState(0);
  const longPressTimer = useRef(null);
  const touchStartX    = useRef(null);
  const swipeTriggered = useRef(false);

  const handleReact = (emoji) => setReaction((prev) => prev === emoji ? null : emoji);

  // Long press
  const onTouchStart = (e) => {
    longPressTimer.current = setTimeout(() => setMenuOpen(true), 500);
    touchStartX.current = e.touches[0].clientX;
    swipeTriggered.current = false;
  };
  const onTouchMove = (e) => {
    clearTimeout(longPressTimer.current);
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    // FIX #6: swipe left (dx < -40) triggers reply
    if (dx < -40 && !swipeTriggered.current) {
      setSwipeX(Math.max(dx, -60));
    } else if (dx > 0) {
      setSwipeX(0);
    }
  };
  const onTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    if (swipeX < -35 && !swipeTriggered.current) {
      swipeTriggered.current = true;
      onReply(msg);
    }
    setSwipeX(0);
    touchStartX.current = null;
  };

  const isSeen  = msg.seenBy?.some((id) => String(id) !== String(myId));
  const isTemp  = !!msg._tempId;
  const isFailed = msg._failed;

  // FIX #1: mediaType check — backend "voice" bhi bhejta hai
  const hasMedia = !!msg.mediaUrl;
  const isImage  = msg.mediaType === "image";
  const isVideo  = msg.mediaType === "video";
  const isVoice  = msg.mediaType === "voice";
  const isFile   = hasMedia && !isImage && !isVideo && !isVoice;

  return (
    <div
      className={`flex flex-col relative ${isMine ? "items-end" : "items-start"} mb-1`}
      style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? "transform 0.2s" : "none" }}
      onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe reply hint */}
      {swipeX < -20 && (
        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 text-purple-400 opacity-80">
          {Icon.reply}
        </div>
      )}

      {/* Reply preview */}
      {msg.replyTo && (
        <div className={`flex items-start gap-1 mb-1 max-w-[75%] px-2 py-1 rounded-xl border-l-2 border-purple-500 bg-white/5 text-xs text-gray-400 ${isMine ? "mr-1" : "ml-1"}`}>
          <span className="truncate">{msg.replyTo?.text || "Media"}</span>
        </div>
      )}

      {/* Bubble */}
      <div className={`relative max-w-[75%] rounded-2xl overflow-hidden ${isMine ? "bg-purple-600 rounded-tr-sm" : "bg-white/10 rounded-tl-sm"} ${isTemp ? "opacity-60" : ""} ${isFailed ? "border border-red-500" : ""} transition-opacity`}>
        {/* FIX #1: mediaUrl se image show hogi chahe reload ho — src always mediaUrl */}
        {isImage && (
          <button type="button" onClick={() => onImageClick(msg.mediaUrl)} className="block w-full">
            <img src={msg.mediaUrl} alt="img" className="max-w-[260px] max-h-[200px] object-cover w-full" loading="lazy" />
          </button>
        )}
        {isVideo && <video src={msg.mediaUrl} controls className="max-w-[260px] max-h-[200px] w-full" />}
        {isVoice && <VoicePlayer src={msg.mediaUrl} duration={msg.duration} />}
        {isFile && (
          <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-gray-300 flex-shrink-0">{Icon.file}</div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate max-w-[160px]">{msg.fileName || "File"}</p>
              {msg.fileSize && <p className="text-[10px] text-gray-400">{fmtSize(msg.fileSize)}</p>}
            </div>
          </a>
        )}
        {/* FIX #5: SmartText instead of plain <p> */}
        {msg.text ? <SmartText text={msg.text} /> : null}
      </div>

      {reaction && (
        <button type="button" onClick={() => setReaction(null)} className={`text-sm mt-0.5 px-1.5 py-0.5 rounded-full bg-white/10 border border-white/10 ${isMine ? "mr-1" : "ml-1"}`}>{reaction}</button>
      )}

      <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? "flex-row-reverse" : ""}`}>
        <span className="text-[9px] text-gray-600">{isTemp ? "sending..." : isFailed ? "failed ✕" : fmtTime(msg.createdAt)}</span>
        {isMine && !isTemp && <span className={isSeen ? "text-purple-400" : "text-gray-600"}>{Icon.seendbl}</span>}
      </div>

      {menuOpen && <MsgMenu msg={msg} isMine={isMine} onReply={onReply} onDeleteMe={onDeleteMe} onDeleteAll={onDeleteAll} onReact={handleReact} onClose={() => setMenuOpen(false)} />}
    </div>
  );
}

// ─── FIX #4: MediaGallery — user name pe click se saara media dikhega ─────────
function MediaGallery({ chatId, friend, onClose, onImageClick }) {
  const [media, setMedia]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("images"); // images | videos | files

  useEffect(() => {
    if (!chatId) return;
    (async () => {
      try {
        // Saare messages fetch karo aur media filter karo
        const res = await api.get(`/api/ecosystem/chat/${chatId}/messages?limit=100`);
        const msgs = res.data?.messages || [];
        setMedia(msgs.filter((m) => m.mediaUrl));
      } catch { setMedia([]); }
      finally { setLoading(false); }
    })();
  }, [chatId]);

  const images = media.filter((m) => m.mediaType === "image");
  const videos = media.filter((m) => m.mediaType === "video");
  const files  = media.filter((m) => m.mediaType === "file");

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">{Icon.back}</button>
          <div>
            <p className="font-semibold text-sm">{friend.fullName}'s Media</p>
            <p className="text-xs text-gray-500">{media.length} items</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          {[["images","Photos",images.length],["videos","Videos",videos.length],["files","Files",files.length]].map(([key,label,count]) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-xs font-semibold transition ${tab===key ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-500 hover:text-white"}`}>
              {label} {count > 0 && <span className="ml-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{count}</span>}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {loading && <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>}
          {!loading && tab === "images" && (
            images.length === 0
              ? <p className="text-center text-gray-600 text-sm py-12">No images yet</p>
              : <div className="grid grid-cols-3 gap-1">
                  {images.map((m) => (
                    <button key={m._id} type="button" onClick={() => onImageClick(m.mediaUrl)} className="aspect-square rounded-lg overflow-hidden">
                      <img src={m.mediaUrl} alt="" className="w-full h-full object-cover hover:opacity-80 transition" loading="lazy" />
                    </button>
                  ))}
                </div>
          )}
          {!loading && tab === "videos" && (
            videos.length === 0
              ? <p className="text-center text-gray-600 text-sm py-12">No videos yet</p>
              : <div className="space-y-2">
                  {videos.map((m) => <video key={m._id} src={m.mediaUrl} controls className="w-full rounded-xl max-h-48" />)}
                </div>
          )}
          {!loading && tab === "files" && (
            files.length === 0
              ? <p className="text-center text-gray-600 text-sm py-12">No files yet</p>
              : <div className="space-y-2">
                  {files.map((m) => (
                    <a key={m._id} href={m.mediaUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 transition">
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-gray-300 flex-shrink-0">{Icon.file}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.fileName || "File"}</p>
                        {m.fileSize && <p className="text-xs text-gray-500">{fmtSize(m.fileSize)}</p>}
                      </div>
                    </a>
                  ))}
                </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CHAT PANEL ───────────────────────────────────────────────────────────────
function ChatPanel({ friend, myId, onClose }) {
  const { user } = useContext(AuthContext);

  const [messages,     setMessages]     = useState([]);
  const [text,         setText]         = useState("");
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [chatError,    setChatError]    = useState(null);
  const [typing,       setTyping]       = useState(false);
  const [showEmoji,    setShowEmoji]    = useState(false);
  const [showAttach,   setShowAttach]   = useState(false);
  const [showVoice,    setShowVoice]    = useState(false); // FIX: was missing
  const [showGallery,  setShowGallery]  = useState(false); // FIX #4
  const [isReady,      setIsReady]      = useState(false);
  const [replyTo,      setReplyTo]      = useState(null);
  const [viewImg,      setViewImg]      = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [friendOnline, setFriendOnline] = useState(false);
  const [lastSeen,     setLastSeen]     = useState(null);

  const bottomRef       = useRef(null);
  const inputRef        = useRef(null);
  const fileInputRef    = useRef(null);
  const typingTimer     = useRef(null);
  const typingStartRef  = useRef(null);
  const chatIdRef       = useRef(null);
  const myIdRef         = useRef(myId);
  const friendUsernameRef = useRef(friend?.username);
  const isFetchingRef   = useRef(false);
  const mountedRef      = useRef(true);
  // FIX #2: Android keyboard — track if input should stay focused
  const keepFocusRef    = useRef(false);

  const friendId = friend?._id ? String(friend._id) : null;

  useEffect(() => { myIdRef.current = myId; if (friend?.username) friendUsernameRef.current = friend.username; });
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const resolvedMyId = user?._id || user?.id;
    if (!resolvedMyId || !friendId) { setChatError("Session ya friend data missing."); setLoading(false); return; }

    const initChat = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true); setIsReady(false); setChatError(null);
      try {
        const r  = await api.get(`/api/ecosystem/chat/direct/${friendId}`);
        const id = r.data?.chatId;
        if (!id) throw new Error("chatId missing");
        if (!mountedRef.current) return;
        chatIdRef.current = id;

        const msgsRes = await api.get(`/api/ecosystem/chat/${id}/messages`);
        if (!mountedRef.current) return;
        // FIX #1: backend newest-first bhejta hai — reverse for display
        setMessages([...(msgsRes.data?.messages || [])].reverse());
        api.put(`/api/ecosystem/chat/${id}/seen`).catch(() => {});

        const sock = getSocket();
        if (!sock.connected) sock.connect();
        sock.emit("join_room", { roomType: "chat", roomId: id });

        if (mountedRef.current) { setIsReady(true); setLoading(false); }
      } catch (e) {
        if (!mountedRef.current) return;
        const s = e?.response?.status;
        let msg = e?.response?.data?.msg || e?.message || "Chat load nahi hua";
        if (s === 403) msg = "Permission nahi. Pehle friend request accept karo.";
        if (s === 401) msg = "Session expire. Page refresh karo.";
        setChatError(msg); setLoading(false);
      } finally { isFetchingRef.current = false; }
    };

    initChat();

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const onMessage = (msg) => {
      if (!mountedRef.current) return;
      setMessages((prev) => {
        if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
        const ti = prev.findIndex((m) => m._tempId && m.text === msg.text && String(m.sender?._id||m.sender) === String(msg.sender?._id||msg.sender));
        if (ti !== -1) { const c = [...prev]; c[ti] = msg; return c; }
        return [...prev, msg];
      });
      setTyping(false);
      if (chatIdRef.current) api.put(`/api/ecosystem/chat/${chatIdRef.current}/seen`).catch(() => {});
    };

    const onSeen = ({ chatId, seenBy }) => {
      if (chatId !== chatIdRef.current || !mountedRef.current) return;
      setMessages((prev) => prev.map((m) => m.seenBy?.includes(seenBy) ? m : { ...m, seenBy: [...(m.seenBy||[]), seenBy] }));
    };

    const onDeleted = ({ messageId }) => { if (mountedRef.current) setMessages((prev) => prev.filter((m) => m._id !== messageId)); };

    // FIX #3: typing event — socket se "username" field aata hai
    const onTyping   = ({ username }) => { if (mountedRef.current && username === friendUsernameRef.current) setTyping(true); };
    const onStopType = () => { if (mountedRef.current) setTyping(false); };

    const onStatus = ({ userId, status, lastActive }) => {
      if (!mountedRef.current || String(userId) !== String(friendId)) return;
      setFriendOnline(status === "online");
      if (status === "offline" && lastActive) setLastSeen(lastActive);
    };

    socket.on("receive_message",         onMessage);
    socket.on("messages_seen",           onSeen);
    socket.on("message_deleted_for_all", onDeleted);
    // FIX #3: correct event names — "user_typing" / "user_stopped_typing"
    socket.on("user_typing",             onTyping);
    socket.on("user_stopped_typing",     onStopType);
    socket.on("user_status_changed",     onStatus);

    return () => {
      socket.off("receive_message",         onMessage);
      socket.off("messages_seen",           onSeen);
      socket.off("message_deleted_for_all", onDeleted);
      socket.off("user_typing",             onTyping);
      socket.off("user_stopped_typing",     onStopType);
      socket.off("user_status_changed",     onStatus);
      if (chatIdRef.current) socket.emit("leave_chat_room", { chatId: chatIdRef.current });
      clearTimeout(typingTimer.current);
      clearTimeout(typingStartRef.current);
    };
  }, [friendId]); // eslint-disable-line

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleRetry = useCallback(async () => {
    if (isFetchingRef.current || !friendId) return;
    isFetchingRef.current = true;
    setLoading(true); setIsReady(false); setChatError(null);
    try {
      const r  = await api.get(`/api/ecosystem/chat/direct/${friendId}`);
      const id = r.data?.chatId;
      if (!id) throw new Error("chatId missing");
      chatIdRef.current = id;
      const msgsRes = await api.get(`/api/ecosystem/chat/${id}/messages`);
      setMessages([...(msgsRes.data?.messages || [])].reverse());
      const sock = getSocket();
      if (!sock.connected) sock.connect();
      sock.emit("join_room", { roomType: "chat", roomId: id });
      setIsReady(true);
    } catch (e) { setChatError(e?.response?.data?.msg || "Retry failed"); }
    finally { setLoading(false); isFetchingRef.current = false; }
  }, [friendId]);

  // Typing
  const handleTextChange = (e) => {
    setText(e.target.value);
    const cid = chatIdRef.current;
    if (!cid) return;
    const socket = getSocket();
    clearTimeout(typingTimer.current);
    if (!typingStartRef.current) {
      socket.emit("typing_start", { chatId: cid, username: myIdRef.current });
      typingStartRef.current = setTimeout(() => { typingStartRef.current = null; }, 1500);
    }
    typingTimer.current = setTimeout(() => { socket.emit("typing_stop", { chatId: cid }); }, 2000);
  };

  // FIX #2: Android keyboard — send ke baad input focus maintain karo
  const send = async () => {
    const trimmed = text.trim();
    const cid     = chatIdRef.current;
    if (!trimmed || !cid || !isReady) return;

    setText(""); setSending(true); setShowEmoji(false); setReplyTo(null);
    clearTimeout(typingTimer.current);
    if (typingStartRef.current) { clearTimeout(typingStartRef.current); typingStartRef.current = null; }
    getSocket().emit("typing_stop", { chatId: cid });

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { _tempId: tempId, text: trimmed, sender: { _id: myIdRef.current }, createdAt: new Date().toISOString(), replyTo: replyTo ? { text: replyTo.text } : null }]);

    // FIX #2: Android pe keyboard band hone se rokne ke liye — readOnly trick
    keepFocusRef.current = true;
    requestAnimationFrame(() => { inputRef.current?.focus(); });

    try {
      const res = await api.post("/api/ecosystem/chat/send", { chatId: cid, text: trimmed, replyTo: replyTo?._id || null });
      const realMsg = res.data?.message;
      if (realMsg?._id) setMessages((prev) => prev.map((m) => m._tempId === tempId ? realMsg : m));
    } catch (e) {
      setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...m, _failed: true, _tempId: undefined } : m));
      setText(trimmed);
      setChatError(e?.response?.data?.msg || "Message send nahi hua.");
      setTimeout(() => setChatError(null), 4000);
    } finally {
      setSending(false);
      keepFocusRef.current = false;
      // FIX #2: small delay phir focus — Android Chrome fix
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sendMedia = async (file) => {
    const cid = chatIdRef.current;
    if (!file || !cid || !isReady) return;
    setUploading(true); setShowAttach(false);
    const tempId  = `temp-media-${Date.now()}`;
    const isImg   = file.type.startsWith("image/");
    const isVid   = file.type.startsWith("video/");
    const preview = (isImg || isVid) ? URL.createObjectURL(file) : null;
    setMessages((prev) => [...prev, { _tempId: tempId, text: "", sender: { _id: myIdRef.current }, createdAt: new Date().toISOString(), mediaUrl: preview, mediaType: isImg ? "image" : isVid ? "video" : "file", fileName: file.name, fileSize: file.size }]);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("chatId", cid);
      const res = await api.post("/api/ecosystem/chat/send-media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const realMsg = res.data?.message;
      // FIX #1: real message mein actual S3 mediaUrl hoga — replace optimistic
      if (realMsg?._id) setMessages((prev) => prev.map((m) => m._tempId === tempId ? realMsg : m));
    } catch {
      setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...m, _failed: true } : m));
      setChatError("File upload nahi hua."); setTimeout(() => setChatError(null), 4000);
    } finally {
      setUploading(false);
      if (preview) URL.revokeObjectURL(preview);
    }
  };

  const sendVoice = async (blob, duration) => {
    const cid = chatIdRef.current;
    if (!blob || !cid || !isReady) return;
    setShowVoice(false); setUploading(true); // FIX: showVoice state use
    const tempId  = `temp-voice-${Date.now()}`;
    const preview = URL.createObjectURL(blob);
    setMessages((prev) => [...prev, { _tempId: tempId, text: "", sender: { _id: myIdRef.current }, createdAt: new Date().toISOString(), mediaUrl: preview, mediaType: "voice", duration }]);
    try {
      const fd = new FormData();
      fd.append("file", blob, "voice.webm");
      fd.append("chatId", cid); fd.append("isVoice", "true"); fd.append("duration", String(duration));
      const res = await api.post("/api/ecosystem/chat/send-media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const realMsg = res.data?.message;
      if (realMsg?._id) setMessages((prev) => prev.map((m) => m._tempId === tempId ? realMsg : m));
    } catch {
      setMessages((prev) => prev.map((m) => m._tempId === tempId ? { ...m, _failed: true } : m));
      setChatError("cant send voice."); setTimeout(() => setChatError(null), 4000);
    } finally { setUploading(false); URL.revokeObjectURL(preview); }
  };

  const deleteForMe  = async (msgId) => { try { await api.delete(`/api/ecosystem/chat/messages/${msgId}/delete-me`); setMessages((prev) => prev.filter((m) => m._id !== msgId)); } catch { setChatError("cant delete."); setTimeout(() => setChatError(null), 3000); } };
  const deleteForAll = async (msgId) => { try { await api.delete(`/api/ecosystem/chat/messages/${msgId}/delete-all`); setMessages((prev) => prev.filter((m) => m._id !== msgId)); } catch { setChatError("cant delete."); setTimeout(() => setChatError(null), 3000); } };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === "Escape") { setShowEmoji(false); setShowAttach(false); setReplyTo(null); setShowVoice(false); }
  };

  // FIX #7: last active text sahi dikhao
  const lastSeenText = () => {
    if (friendOnline) return <span className="text-green-400">Online</span>;
    if (!lastSeen) return <span>@{friend.username || ""}</span>;
    const diff = Date.now() - new Date(lastSeen).getTime();
    if (diff < 60000) return <span className="text-gray-500">Last seen just now</span>;
    if (diff < 3600000) return <span className="text-gray-500">Last seen {Math.floor(diff/60000)}m ago</span>;
    if (diff < 86400000) return <span className="text-gray-500">Last seen {Math.floor(diff/3600000)}h ago</span>;
    return <span className="text-gray-500">Last seen {new Date(lastSeen).toLocaleDateString()}</span>;
  };

  if (!friendId) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center">
        <p className="text-red-400 mb-4">Friend data missing.</p>
        <button type="button" onClick={onClose} className="px-4 py-2 bg-white/10 rounded-full text-sm">Close</button>
      </div>
    </div>
  );

  return (
    <>
      {viewImg    && <ImageModal src={viewImg} name="image" onClose={() => setViewImg(null)} />}
      {/* FIX #4: MediaGallery */}
      {showGallery && <MediaGallery chatId={chatIdRef.current} friend={friend} onClose={() => setShowGallery(false)} onImageClick={(src) => { setShowGallery(false); setViewImg(src); }} />}

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-[#0f0f0f] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md h-[90vh] sm:h-[640px] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#141414] flex-shrink-0">
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white transition">{Icon.back}</button>
            <div className="relative flex-shrink-0">
              <img src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName||"U")}&background=7c3aed&color=fff&bold=true`} alt={friend.fullName} className="w-9 h-9 rounded-full object-cover" />
              {friendOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#141414]" />}
            </div>
            {/* FIX #4: name pe click se gallery khulegi */}
            <div className="flex-1 min-w-0">
              <button type="button" onClick={() => chatIdRef.current && setShowGallery(true)}
                className="font-semibold text-sm truncate hover:text-purple-300 transition text-left w-full flex items-center gap-1">
                {friend.fullName || friend.username}
                <span className="text-gray-600 scale-75">{Icon.gallery}</span>
              </button>
              {/* FIX #3 + #7: typing indicator aur last active */}
              <p className="text-[10px]">
                {typing ? <span className="text-purple-400 animate-pulse">typing...</span> : lastSeenText()}
              </p>
            </div>
            <div title={isReady ? "Connected" : loading ? "Connecting..." : "Error"} className={`w-2 h-2 rounded-full flex-shrink-0 ${isReady ? "bg-green-500" : loading ? "bg-yellow-500 animate-pulse" : "bg-red-500"}`} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
            {loading && <div className="flex flex-col items-center mt-12 gap-3"><div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/><p className="text-xs text-gray-500">Loading...</p></div>}
            {!loading && chatError && !isReady && (
              <div className="mt-8 px-4 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                <p className="text-red-400 text-sm mb-3">{chatError}</p>
                <button type="button" onClick={handleRetry} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-full transition">Retry</button>
              </div>
            )}
            {!loading && !chatError && messages.length === 0 && isReady && <p className="text-center text-gray-600 text-sm mt-12">Say hello! 👋</p>}
            {messages.map((m, i) => {
              const senderId = String(m.sender?._id || m.sender || "");
              const isMine   = senderId === String(myId);
              const msgKey   = m._id ? `msg-${m._id}` : m._tempId || `idx-${i}`;
              return (
                <MessageBubble key={msgKey} msg={m} isMine={isMine} myId={myId}
                  onReply={setReplyTo} onDeleteMe={deleteForMe} onDeleteAll={deleteForAll} onImageClick={setViewImg} />
              );
            })}
            {uploading && <div className="flex justify-end mt-1"><div className="px-4 py-2 bg-purple-600/40 rounded-2xl text-xs text-gray-300 flex items-center gap-2"><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"/>Uploading...</div></div>}
            <div ref={bottomRef} />
          </div>

          {chatError && isReady && <div className="mx-4 mb-1 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex-shrink-0"><p className="text-red-400 text-xs text-center">{chatError}</p></div>}

          {replyTo && (
            <div className="mx-3 mb-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-2 flex-shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] text-purple-400 font-semibold mb-0.5">Replying to</p>
                <p className="text-xs text-gray-400 truncate">{replyTo.text || "Media"}</p>
              </div>
              <button type="button" onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white flex-shrink-0">{Icon.x}</button>
            </div>
          )}

          {showVoice && <VoiceRecorder onSend={sendVoice} onCancel={() => setShowVoice(false)} disabled={!isReady} />}

          {showAttach && (
            <div className="mx-3 mb-1 px-3 py-2 bg-[#1c1c1e] border border-white/10 rounded-2xl flex gap-3 flex-shrink-0">
              {[
                { label:"Image", icon:Icon.img, accept:"image/*" },
                { label:"Video", icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>, accept:"video/*" },
                { label:"File",  icon:Icon.attach, accept:"*/*" },
              ].map(({ label, icon, accept }) => (
                <button key={label} type="button" onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = accept; fileInputRef.current.click(); } }}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:bg-white/5 transition text-gray-400 hover:text-white">
                  {icon}<span className="text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          )}

          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendMedia(f); e.target.value = ""; }} />

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/10 flex items-center gap-2 flex-shrink-0 relative">
            {showEmoji && (
              <EmojiPicker
                onSelect={(em) => { setText((p) => p + em); setShowEmoji(false); setTimeout(() => inputRef.current?.focus(), 0); }}
                onClose={() => setShowEmoji(false)}
              />
            )}
            <button type="button" onClick={() => { setShowEmoji((v) => !v); setShowAttach(false); setShowVoice(false); }} disabled={!isReady} className="text-gray-500 hover:text-purple-400 disabled:opacity-30 transition p-1 flex-shrink-0">{Icon.emoji}</button>
            <button type="button" onClick={() => { setShowAttach((v) => !v); setShowEmoji(false); setShowVoice(false); }} disabled={!isReady} className="text-gray-500 hover:text-purple-400 disabled:opacity-30 transition p-1 flex-shrink-0">{Icon.attach}</button>

            {/* FIX #2: Android keyboard — enterKeyHint="send", no readOnly toggle */}
            <input
              ref={inputRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={onKey}
              inputMode="text"
              enterKeyHint="send"
              autoComplete="off"
              autoCorrect="off"
              placeholder={loading ? "Connecting..." : !isReady ? (chatError ? "Error — Retry ↑" : "Connecting...") : "Message..."}
              disabled={!isReady || loading}
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 disabled:opacity-40 transition min-w-0"
            />

            {/* Mic button — only when text empty */}
            {!text.trim() && (
              <button type="button" onClick={() => { setShowVoice((v) => !v); setShowEmoji(false); setShowAttach(false); }} disabled={!isReady}
                className="w-9 h-9 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-full flex items-center justify-center transition flex-shrink-0 text-gray-400">
                {Icon.mic}
              </button>
            )}

            <button type="button" onClick={send} disabled={!text.trim() || !isReady || sending}
              className="w-9 h-9 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 rounded-full flex items-center justify-center transition flex-shrink-0">
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : Icon.send2}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── FeedTab ──────────────────────────────────────────────────────────────────
function FeedTab({ navigate }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    (async () => { try { const r = await api.get("/api/ecosystem/feed/get-feed"); setItems(r.data.posts || r.data.feedItems || []); } catch {} finally { setLoading(false); } })();
  }, []);
  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!items.length) return <div className="text-center py-16"><div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">{Icon.shop}</div><p className="text-gray-500 text-sm">No products in feed yet.</p></div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item, i) => {
        const p = item.product || {};
        return (
          <div key={item._id||i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition">
            {p.thumbnailUrl && <img src={p.thumbnailUrl} alt={p.title} className="w-full h-40 object-cover"/>}
            <div className="p-4">
              <span className="text-purple-400 text-[10px] font-bold uppercase tracking-widest">{p.branch}</span>
              <h4 className="font-semibold text-sm mt-1 mb-1 line-clamp-1">{p.title}</h4>
              <p className="text-gray-500 text-xs line-clamp-2 mb-3">{p.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-purple-400 font-bold text-sm">{p.isPaid ? `₹${p.price}` : "Free"}</span>
                <div className="flex items-center gap-3 text-xs text-gray-600"><span>{p.salesCount||0} sold</span><span>{p.viewCount||0} views</span></div>
              </div>
              {item.seller && (
                <button type="button" onClick={() => navigate(`/profile/${item.seller._id}`)} className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 w-full text-left hover:opacity-80 transition">
                  <img src={item.seller.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(item.seller.fullName||"U")}&background=7c3aed&color=fff`} alt={item.seller.fullName} className="w-6 h-6 rounded-full object-cover"/>
                  <span className="text-xs text-gray-500">{item.seller.fullName}</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SuggestionsTab ───────────────────────────────────────────────────────────
function SuggestionsTab({ navigate, sentIds, friendIds, onConnect }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    (async () => { try { const res = await api.get("/api/ecosystem/members/same-branch"); setUsers(res.data.students||[]); } catch { setUsers([]); } finally { setLoading(false); } })();
  }, []);
  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!users.length) return <p className="text-center text-gray-500 py-16 text-sm">No suggestions.</p>;
  return (
    <div className="space-y-2">
      {users.map((u) => {
        const uid = String(u._id); const isFriend = friendIds.has(uid); const isSent = sentIds.has(uid);
        return (
          <div key={u._id} className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl px-4 py-3 transition">
            <button type="button" onClick={() => navigate(`/profile/${u._id}`)}><img src={u.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName||"U")}&background=7c3aed&color=fff`} alt={u.fullName} className="w-10 h-10 rounded-full object-cover"/></button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${u._id}`)}>
              <p className="font-semibold text-sm truncate">{u.fullName}</p>
              <p className="text-xs text-gray-500 truncate">@{u.username} · {u.stream||"—"}</p>
              <RoleBadge role={u.collegeRole}/>
            </div>
            {!isFriend && <button type="button" onClick={() => onConnect(u._id)} disabled={isSent} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${isSent?"bg-gray-700/50 text-gray-500 cursor-not-allowed":"bg-purple-600 hover:bg-purple-500 text-white"}`}>{isSent?"Sent":"+ Connect"}</button>}
          </div>
        );
      })}
    </div>
  );
}

// ─── MemberCard ───────────────────────────────────────────────────────────────
function MemberCard({ member, sentIds, onConnect, onChat, onProfile, friendIds }) {
  const uid = String(member._id); const isFriend = friendIds.has(uid); const isSent = sentIds.has(uid);
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl px-4 py-3 transition">
      <button type="button" onClick={() => onProfile(member)} className="flex-shrink-0"><img src={member.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName||"U")}&background=7c3aed&color=fff`} alt={member.fullName} className="w-10 h-10 rounded-full object-cover"/></button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onProfile(member)}>
        <p className="font-semibold text-sm truncate hover:text-purple-300">{member.fullName}</p>
        <p className="text-xs text-gray-500 truncate">@{member.username} · {member.stream||"—"}</p>
        <div className="mt-1"><RoleBadge role={member.role||member.collegeRole}/></div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {isFriend
          ? <button type="button" onClick={() => onChat(member)} className="px-3 py-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-purple-600/40 transition">{Icon.chat} Chat</button>
          : <button type="button" onClick={() => onConnect(member._id)} disabled={isSent} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${isSent?"bg-gray-700/50 text-gray-500 cursor-not-allowed":"bg-purple-600 hover:bg-purple-500 text-white"}`}>{isSent?"Sent":"Connect"}</button>}
      </div>
    </div>
  );
}

// ─── RequestCard ──────────────────────────────────────────────────────────────
function RequestCard({ request, type, onAccept, onDecline, navigate }) {
  const person = type === "incoming" ? (request.from||null) : (request.to||null);
  if (!person?._id) return null;
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3">
      <button type="button" onClick={() => navigate(`/profile/${person._id}`)}><img src={person.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName||"U")}&background=7c3aed&color=fff`} alt={person.fullName} className="w-10 h-10 rounded-full object-cover"/></button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${person._id}`)}>
        <p className="font-semibold text-sm truncate">{person.fullName}</p>
        <p className="text-xs text-gray-500">@{person.username}</p>
      </div>
      {type === "incoming" && <div className="flex gap-2">
        <button type="button" onClick={() => onAccept(request._id)} className="w-8 h-8 bg-green-600/20 text-green-400 border border-green-500/30 rounded-full flex items-center justify-center hover:bg-green-600/40 transition">{Icon.check}</button>
        <button type="button" onClick={() => onDecline(request._id)} className="w-8 h-8 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full flex items-center justify-center hover:bg-red-600/40 transition">{Icon.x}</button>
      </div>}
      {type === "outgoing" && <span className="text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">Pending</span>}
    </div>
  );
}

// ─── FriendRow ────────────────────────────────────────────────────────────────
function FriendRow({ friend, onChat, navigate }) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3">
      <button type="button" onClick={() => navigate(`/profile/${friend._id}`)}><img src={friend.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName||"U")}&background=7c3aed&color=fff`} alt={friend.fullName} className="w-10 h-10 rounded-full object-cover"/></button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${friend._id}`)}>
        <p className="font-semibold text-sm truncate">{friend.fullName}</p>
        <p className="text-xs text-gray-500 truncate">@{friend.username}</p>
      </div>
      <button type="button" onClick={() => onChat(friend)} className="px-3 py-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-purple-600/40 transition flex-shrink-0">{Icon.chat} Chat</button>
    </div>
  );
}

// ─── ProfileModal ─────────────────────────────────────────────────────────────
function ProfileModal({ user: u, onClose, onChat, isFriend, isSent, onConnect, onNavigate, enlargeAvatar, setEnlargeAvatar }) {
  if (!u?._id) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">{Icon.x}</button>
          <div className="flex flex-col items-center text-center">
            <button type="button" onClick={() => setEnlargeAvatar(true)} className="cursor-zoom-in hover:scale-105 transition">
              <img src={u.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName||"U")}&background=7c3aed&color=fff&bold=true`} alt={u.fullName} className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"/>
            </button>
            <h3 className="text-xl font-bold mt-3">{u.fullName}</h3>
            <p className="text-gray-500 text-sm">@{u.username}</p>
            <div className="mt-2"><RoleBadge role={u.role||u.collegeRole}/></div>
            {u.stream && <p className="text-xs text-gray-500 mt-1">🎓 {u.stream}</p>}
          </div>
          <div className="flex gap-3 mt-6">
            {isFriend
              ? <button type="button" onClick={() => { onClose(); onChat(u); }} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">{Icon.chat} Message</button>
              : <button type="button" onClick={() => onConnect(u._id)} disabled={isSent} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${isSent?"bg-gray-700 text-gray-400 cursor-not-allowed":"bg-purple-600 hover:bg-purple-500 text-white"}`}>{isSent?"Request Sent":"Connect"}</button>}
            <button type="button" onClick={() => { onClose(); onNavigate(`/profile/${u._id}`); }} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition border border-white/10">View Profile</button>
          </div>
        </div>
      </div>
      {enlargeAvatar && <ImageModal src={u.avatar} name={u.fullName} onClose={() => setEnlargeAvatar(false)} />}
    </>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function CommunityView() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const myId     = user?._id || user?.id;

  const [college, setCollege]               = useState(null);
  const [members, setMembers]               = useState([]);
  const [friends, setFriends]               = useState([]);
  const [incoming, setIncoming]             = useState([]);
  const [outgoing, setOutgoing]             = useState([]);
  const [loading, setLoading]               = useState(false);
  const [activeTab, setActiveTab]           = useState("members");
  const [sentIds, setSentIds]               = useState(new Set());
  const [chatTarget, setChatTarget]         = useState(null);
  const [profileUser, setProfileUser]       = useState(null);
  const [enlargeProfile, setEnlargeProfile] = useState(false);
  const [showInfo, setShowInfo]             = useState(false);
  const [toast, setToast]                   = useState(null);
  const [hasFetched, setHasFetched]         = useState(false);

  const friendIds = useMemo(() => new Set(friends.map((f) => String(f._id))), [friends]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!myId || hasFetched) return;
    setLoading(true); setHasFetched(true);
    try {
      const [colRes, memRes, friRes, incRes, outRes] = await Promise.allSettled([
        api.get("/api/createcollege/my-college"),
        api.get("/api/ecosystem/members"),
        api.get("/api/ecosystem/friends/"),
        api.get("/api/ecosystem/friends/requests/incoming"),
        api.get("/api/ecosystem/friends/requests/outgoing"),
      ]);
      if (colRes.status === "fulfilled") setCollege(colRes.value.data?.college || null);
      if (memRes.status === "fulfilled") setMembers(memRes.value.data?.members || []);
      if (friRes.status === "fulfilled") setFriends(friRes.value.data?.friends || []);
      if (incRes.status === "fulfilled") setIncoming(incRes.value.data?.requests || []);
      if (outRes.status === "fulfilled") setOutgoing(outRes.value.data?.requests || []);
    } finally { setLoading(false); }
  }, [myId, hasFetched]);

  useEffect(() => { if (!authLoading && myId) fetchAll(); }, [authLoading, myId, fetchAll]);

  useEffect(() => {
    if (!myId) return;
    const socket = getSocket();
    const onNewReq = (req) => { setIncoming((prev) => [req, ...prev]); showToast("You have a new friend request!"); };
    socket.on("new_friend_request", onNewReq);
    return () => socket.off("new_friend_request", onNewReq);
  }, [myId, showToast]);

  const sendRequest = async (userId) => {
    try { await api.post("/api/ecosystem/friends/request", { to: userId }); setSentIds((prev) => new Set([...prev, String(userId)])); showToast("Request sent!"); }
    catch (e) { showToast(e?.response?.data?.msg || "cant send request", "error"); }
  };

  const acceptRequest = async (requestId) => {
    try { await api.post("/api/ecosystem/friends/accept", { requestId }); showToast("Friend added! 🎉"); setHasFetched(false); }
    catch { showToast("cant accept", "error"); }
  };

  const declineRequest = async (requestId) => {
    try { await api.post("/api/ecosystem/friends/decline", { requestId }); setIncoming((prev) => prev.filter((r) => r._id !== requestId)); showToast("Request declined"); }
    catch { showToast("cant decline", "error"); }
  };

  const tabs = [
    { key:"members",     label:"Members",  icon:Icon.users,   count:members.length },
    { key:"suggestions", label:"Discover", icon:Icon.suggest, count:null },
    { key:"friends",     label:"Friends",  icon:Icon.friends, count:friends.length },
    { key:"incoming",    label:"Requests", icon:Icon.inbox,   count:incoming.length },
    { key:"outgoing",    label:"Sent",     icon:Icon.send2,   count:outgoing.length },
    { key:"feed",        label:"Feed",     icon:Icon.feed,    count:null },
  ];

  if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!myId) return <div className="min-h-screen bg-black flex items-center justify-center px-4"><div className="text-center"><p className="text-gray-400 mb-4">Login for community access</p><button type="button" onClick={() => navigate("/login")} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition">Login</button></div></div>;
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!college && hasFetched) return <div className="min-h-screen bg-black flex items-center justify-center px-4"><div className="text-center max-w-sm"><div className="w-16 h-16 bg-purple-600/10 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-500">{Icon.users}</div><h2 className="text-2xl font-bold mb-2">community not found</h2><p className="text-gray-500 text-sm mb-6">Invite code se college join karo.</p><button type="button" onClick={() => navigate("/")} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition">Go Home</button></div></div>;
  if (!college) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-black text-white">
      {toast && <div className={`fixed top-4 right-4 z-[200] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg ${toast.type==="error"?"bg-red-600":"bg-green-600"} text-white`}>{toast.msg}</div>}

      <div className="bg-gradient-to-b from-purple-900/30 to-transparent pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-purple-600 flex items-center justify-center text-2xl font-extrabold">
              {college.logo_url ? <img src={college.logo_url} alt="logo" className="w-full h-full object-cover"/> : college.college_name?.[0]?.toUpperCase()||"C"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight truncate">{college.college_name}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{college.university}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">{Icon.users} {college.usageCount||members.length} members</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] border font-semibold ${college.status==="active"?"bg-green-500/10 text-green-400 border-green-500/20":"bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>{college.status||"active"}</span>
              </div>
            </div>
            <button type="button" onClick={() => setShowInfo(true)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition text-gray-400">{Icon.info}</button>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
            {tabs.map((t) => (
              <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${activeTab===t.key?"bg-purple-600 text-white":"text-gray-500 hover:text-white hover:bg-white/5"}`}>
                {t.icon}{t.label}
                {t.count !== null && t.count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab===t.key?"bg-white/20 text-white":"bg-white/10 text-gray-400"}`}>{t.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className={activeTab==="members"?"":"hidden"}><div className="space-y-2">{members.length===0&&<p className="text-center py-16 text-gray-600 text-sm">No members found.</p>}{members.map((m)=><MemberCard key={m._id} member={m} sentIds={sentIds} friendIds={friendIds} onConnect={sendRequest} onChat={setChatTarget} onProfile={setProfileUser}/>)}</div></div>
        <div className={activeTab==="suggestions"?"":"hidden"}><SuggestionsTab navigate={navigate} sentIds={sentIds} friendIds={friendIds} onConnect={sendRequest}/></div>
        <div className={activeTab==="friends"?"":"hidden"}><div className="space-y-2">{friends.length===0&&<p className="text-center py-16 text-gray-500 text-sm">No friends yet. Members se connect karo!</p>}{friends.map((f)=><FriendRow key={f._id} friend={f} onChat={setChatTarget} navigate={navigate}/>)}</div></div>
        <div className={activeTab==="incoming"?"":"hidden"}><div className="space-y-2">{incoming.length===0&&<p className="text-center py-16 text-gray-600 text-sm">Koi incoming request nahi.</p>}{incoming.map((r)=><RequestCard key={r._id} request={r} type="incoming" onAccept={acceptRequest} onDecline={declineRequest} navigate={navigate}/>)}</div></div>
        <div className={activeTab==="outgoing"?"":"hidden"}><div className="space-y-2">{outgoing.length===0&&<p className="text-center py-16 text-gray-600 text-sm">Koi pending request nahi.</p>}{outgoing.map((r)=><RequestCard key={r._id} request={r} type="outgoing" navigate={navigate}/>)}</div></div>
        <div className={activeTab==="feed"?"":"hidden"}><FeedTab navigate={navigate}/></div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Community Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium text-right max-w-[60%] truncate">{college.college_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">University</span><span className="font-medium text-right max-w-[60%] truncate">{college.university}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Members</span><span className="font-medium">{college.usageCount||0} / {college.usageLimit||1000}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={college.status==="active"?"text-green-400":"text-yellow-400"}>{college.status}</span></div>
              {college.description && <div className="pt-3 border-t border-white/10"><p className="text-gray-500 text-xs mb-1">About</p><p className="text-gray-300 text-sm">{college.description}</p></div>}
            </div>
            <button type="button" onClick={() => setShowInfo(false)} className="mt-6 w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition">Close</button>
          </div>
        </div>
      )}

      {profileUser && <ProfileModal user={profileUser} onClose={() => { setProfileUser(null); setEnlargeProfile(false); }} onChat={setChatTarget} isFriend={friendIds.has(String(profileUser._id))} isSent={sentIds.has(String(profileUser._id))} onConnect={sendRequest} onNavigate={navigate} enlargeAvatar={enlargeProfile} setEnlargeAvatar={setEnlargeProfile}/>}

      {chatTarget?._id && <ChatPanel friend={chatTarget} myId={String(myId)} onClose={() => setChatTarget(null)}/>}
    </div>
  );
}