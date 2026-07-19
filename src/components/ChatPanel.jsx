// src/components/chat/ChatPanel.jsx
//
// Extracted out of CommunityView.jsx so the SAME 1-on-1 chat experience
// (with all its media/voice/typing/reply features) can be opened from
// anywhere a friend is shown — CommunityView's member list AND the new
// global Friends page — without duplicating ~500 lines of code twice.
//
// Exports: ChatPanel (default), Icon, RoleBadge, ImageModal — all reused
// by CommunityView.jsx and FriendsHub.jsx.

import {
  useEffect, useState, useRef, useCallback, useContext,
} from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { getSocket } from "../lib/socket";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
export const Icon = {
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
export const RoleBadge = ({ role }) => {
  const map = { owner:"bg-yellow-500/20 text-yellow-300 border-yellow-500/30", principal:"bg-blue-500/20 text-blue-300 border-blue-500/30", hod:"bg-teal-500/20 text-teal-300 border-teal-500/30", teacher:"bg-green-500/20 text-green-300 border-green-500/30", student:"bg-brand-500/20 text-brand-300 border-brand-500/30" };
  if (!role) return null;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${map[role] || map.student}`}>{role}</span>;
};

// ─── ImageModal ───────────────────────────────────────────────────────────────
export function ImageModal({ src, name, onClose }) {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-navy-950/90 backdrop-blur-sm" onClick={onClose}>
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
    } catch { alert("no microphone acess."); }
  };
  const stopRec = () => { recorderRef.current?.stop(); setRecording(false); clearInterval(timerRef.current); };
  const cleanup = () => { if (blobUrl) URL.revokeObjectURL(blobUrl); setBlobUrl(null); setBlob(null); setSeconds(0); setRecording(false); };
  useEffect(() => () => { clearInterval(timerRef.current); if (blobUrl) URL.revokeObjectURL(blobUrl); }, []); // eslint-disable-line

  return (
    <div className="mx-3 mb-1 px-3 py-2 bg-[#1c1c1e] border border-white/10 rounded-2xl flex items-center gap-3 flex-shrink-0">
      {!blobUrl ? (
        <>
          <button type="button" onClick={recording ? stopRec : startRec} disabled={disabled}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition flex-shrink-0 ${recording ? "bg-red-600 hover:bg-red-500 animate-pulse" : "bg-brand-600 hover:bg-brand-500"}`}>
            {recording ? Icon.stop : Icon.mic}
          </button>
          <div className="flex-1">
            {recording
              ? <div className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/><span className="text-sm font-mono text-red-400">{fmtSecs(seconds)}</span></div>
              : <p className="text-sm text-gray-400">press mic to record voice </p>}
          </div>
          <button type="button" onClick={() => { cleanup(); onCancel(); }} className="text-gray-500 hover:text-white flex-shrink-0">{Icon.x}</button>
        </>
      ) : (
        <>
          <VoicePlayer src={blobUrl} duration={seconds} />
          <div className="flex gap-2 flex-shrink-0">
            <button type="button" onClick={cleanup} className="w-8 h-8 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full flex items-center justify-center hover:bg-red-600/40 transition">{Icon.trash}</button>
            <button type="button" onClick={() => { onSend(blob, seconds); cleanup(); }} className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-500 transition">{Icon.send2}</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Smart text renderer — URLs aur emails clickable banata hai ───────────────
function SmartText({ text }) {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
  return (
    <p className="px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap text-white">
      {parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
          return <a key={i} href={part} target="_blank" rel="noreferrer" className="underline text-brand-300 hover:text-brand-200 inline-flex items-center gap-0.5">{Icon.link}{part}</a>;
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

// ─── MessageBubble with swipe-to-reply ───────────────────────────────────────
function MessageBubble({ msg, isMine, myId, onReply, onDeleteMe, onDeleteAll, onImageClick }) {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [reaction,  setReaction]  = useState(msg.reaction || null);
  const [swipeX,    setSwipeX]    = useState(0);
  const longPressTimer = useRef(null);
  const touchStartX    = useRef(null);
  const swipeTriggered = useRef(false);

  const handleReact = (emoji) => setReaction((prev) => prev === emoji ? null : emoji);

  const onTouchStart = (e) => {
    longPressTimer.current = setTimeout(() => setMenuOpen(true), 500);
    touchStartX.current = e.touches[0].clientX;
    swipeTriggered.current = false;
  };
  const onTouchMove = (e) => {
    clearTimeout(longPressTimer.current);
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
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
      {swipeX < -20 && (
        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 text-brand-400 opacity-80">
          {Icon.reply}
        </div>
      )}

      {msg.replyTo && (
        <div className={`flex items-start gap-1 mb-1 max-w-[75%] px-2 py-1 rounded-xl border-l-2 border-brand-500 bg-white/5 text-xs text-gray-400 ${isMine ? "mr-1" : "ml-1"}`}>
          <span className="truncate">{msg.replyTo?.text || "Media"}</span>
        </div>
      )}

      <div className={`relative max-w-[75%] rounded-2xl overflow-hidden ${isMine ? "bg-brand-600 rounded-tr-sm" : "bg-white/10 rounded-tl-sm"} ${isTemp ? "opacity-60" : ""} ${isFailed ? "border border-red-500" : ""} transition-opacity`}>
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
        {msg.text ? <SmartText text={msg.text} /> : null}
      </div>

      {reaction && (
        <button type="button" onClick={() => setReaction(null)} className={`text-sm mt-0.5 px-1.5 py-0.5 rounded-full bg-white/10 border border-white/10 ${isMine ? "mr-1" : "ml-1"}`}>{reaction}</button>
      )}

      <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? "flex-row-reverse" : ""}`}>
        <span className="text-[9px] text-gray-600">{isTemp ? "sending..." : isFailed ? "failed ✕" : fmtTime(msg.createdAt)}</span>
        {isMine && !isTemp && <span className={isSeen ? "text-brand-400" : "text-gray-600"}>{Icon.seendbl}</span>}
      </div>

      {menuOpen && <MsgMenu msg={msg} isMine={isMine} onReply={onReply} onDeleteMe={onDeleteMe} onDeleteAll={onDeleteAll} onReact={handleReact} onClose={() => setMenuOpen(false)} />}
    </div>
  );
}

// ─── MediaGallery — user name pe click se saara media dikhega ────────────────
function MediaGallery({ chatId, friend, onClose, onImageClick }) {
  const [media, setMedia]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("images");

  useEffect(() => {
    if (!chatId) return;
    (async () => {
      try {
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
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">{Icon.back}</button>
          <div>
            <p className="font-semibold text-sm">{friend.fullName}'s Media</p>
            <p className="text-xs text-gray-500">{media.length} items</p>
          </div>
        </div>
        <div className="flex border-b border-white/10 flex-shrink-0">
          {[["images","Photos",images.length],["videos","Videos",videos.length],["files","Files",files.length]].map(([key,label,count]) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-xs font-semibold transition ${tab===key ? "text-brand-400 border-b-2 border-brand-400" : "text-gray-500 hover:text-white"}`}>
              {label} {count > 0 && <span className="ml-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{count}</span>}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {loading && <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>}
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

// ─── CHAT PANEL (default export) ─────────────────────────────────────────────
export default function ChatPanel({ friend, myId, onClose }) {
  const { user } = useContext(AuthContext);

  const [messages,     setMessages]     = useState([]);
  const [text,         setText]         = useState("");
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [chatError,    setChatError]    = useState(null);
  const [typing,       setTyping]       = useState(false);
  const [showEmoji,    setShowEmoji]    = useState(false);
  const [showAttach,   setShowAttach]   = useState(false);
  const [showVoice,    setShowVoice]    = useState(false);
  const [showGallery,  setShowGallery]  = useState(false);
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
  const keepFocusRef    = useRef(false);

  const friendId = friend?._id ? String(friend._id) : null;

  useEffect(() => { myIdRef.current = myId; if (friend?.username) friendUsernameRef.current = friend.username; });
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

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
    setShowVoice(false); setUploading(true);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70">
      <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center">
        <p className="text-red-400 mb-4">Friend data missing.</p>
        <button type="button" onClick={onClose} className="px-4 py-2 bg-white/10 rounded-full text-sm">Close</button>
      </div>
    </div>
  );

  return (
    <>
      {viewImg    && <ImageModal src={viewImg} name="image" onClose={() => setViewImg(null)} />}
      {showGallery && <MediaGallery chatId={chatIdRef.current} friend={friend} onClose={() => setShowGallery(false)} onImageClick={(src) => { setShowGallery(false); setViewImg(src); }} />}

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/70 backdrop-blur-sm">
        <div className="bg-[#0f0f0f] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md h-[90vh] sm:h-[640px] flex flex-col overflow-hidden">

          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#141414] flex-shrink-0">
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white transition">{Icon.back}</button>
            <div className="relative flex-shrink-0">
              <img src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName||"U")}&background=7c3aed&color=fff&bold=true`} alt={friend.fullName} className="w-9 h-9 rounded-full object-cover" />
              {friendOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#141414]" />}
            </div>
            <div className="flex-1 min-w-0">
              <button type="button" onClick={() => chatIdRef.current && setShowGallery(true)}
                className="font-semibold text-sm truncate hover:text-brand-300 transition text-left w-full flex items-center gap-1">
                {friend.fullName || friend.username}
                <span className="text-gray-600 scale-75">{Icon.gallery}</span>
              </button>
              <p className="text-[10px]">
                {typing ? <span className="text-brand-400 animate-pulse">typing...</span> : lastSeenText()}
              </p>
            </div>
            <div title={isReady ? "Connected" : loading ? "Connecting..." : "Error"} className={`w-2 h-2 rounded-full flex-shrink-0 ${isReady ? "bg-green-500" : loading ? "bg-yellow-500 animate-pulse" : "bg-red-500"}`} />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
            {loading && <div className="flex flex-col items-center mt-12 gap-3"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/><p className="text-xs text-gray-500">Loading...</p></div>}
            {!loading && chatError && !isReady && (
              <div className="mt-8 px-4 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                <p className="text-red-400 text-sm mb-3">{chatError}</p>
                <button type="button" onClick={handleRetry} className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-full transition">Retry</button>
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
            {uploading && <div className="flex justify-end mt-1"><div className="px-4 py-2 bg-brand-600/40 rounded-2xl text-xs text-gray-300 flex items-center gap-2"><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"/>Uploading...</div></div>}
            <div ref={bottomRef} />
          </div>

          {chatError && isReady && <div className="mx-4 mb-1 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex-shrink-0"><p className="text-red-400 text-xs text-center">{chatError}</p></div>}

          {replyTo && (
            <div className="mx-3 mb-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-2 flex-shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] text-brand-400 font-semibold mb-0.5">Replying to</p>
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

          <div className="px-3 py-3 border-t border-white/10 flex items-center gap-2 flex-shrink-0 relative">
            {showEmoji && (
              <EmojiPicker
                onSelect={(em) => { setText((p) => p + em); setShowEmoji(false); setTimeout(() => inputRef.current?.focus(), 0); }}
                onClose={() => setShowEmoji(false)}
              />
            )}
            <button type="button" onClick={() => { setShowEmoji((v) => !v); setShowAttach(false); setShowVoice(false); }} disabled={!isReady} className="text-gray-500 hover:text-brand-400 disabled:opacity-30 transition p-1 flex-shrink-0">{Icon.emoji}</button>
            <button type="button" onClick={() => { setShowAttach((v) => !v); setShowEmoji(false); setShowVoice(false); }} disabled={!isReady} className="text-gray-500 hover:text-brand-400 disabled:opacity-30 transition p-1 flex-shrink-0">{Icon.attach}</button>

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
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-brand-500 disabled:opacity-40 transition min-w-0"
            />

            {!text.trim() && (
              <button type="button" onClick={() => { setShowVoice((v) => !v); setShowEmoji(false); setShowAttach(false); }} disabled={!isReady}
                className="w-9 h-9 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-full flex items-center justify-center transition flex-shrink-0 text-gray-400">
                {Icon.mic}
              </button>
            )}

            <button type="button" onClick={send} disabled={!text.trim() || !isReady || sending}
              className="w-9 h-9 bg-brand-600 hover:bg-brand-500 disabled:opacity-30 rounded-full flex items-center justify-center transition flex-shrink-0">
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : Icon.send2}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}