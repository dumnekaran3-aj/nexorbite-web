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

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

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

// ─── MessageBubble ──────────────────────────────────────────────────────────
function MessageBubble({ msg, isMe, canDeleteAny, onDeleteMe, onDeleteAll, onReact, onRemoveReaction, myId, onReply, onImageClick }) {
  const [showActions, setShowActions] = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);

  if (msg.isDeletedForEveryone) {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
        <div className="italic text-xs text-gray-500 bg-white/[0.03] px-3 py-2 rounded-2xl">This message was deleted</div>
      </div>
    );
  }

  const myReaction = msg.reactions?.find((r) => String(r.userId) === String(myId));

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2 group relative`}>
      <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
        {!isMe && msg.sender?.username && (
          <p className="text-[11px] text-brand-400 font-semibold ml-1 mb-0.5">{msg.sender.username}</p>
        )}

        <div className="relative">
          {showReactPicker && (
            <ReactionPicker
              onClose={() => setShowReactPicker(false)}
              onPick={(emoji) => { onReact(msg._id, emoji); setShowReactPicker(false); }}
            />
          )}

          <div
            className={`rounded-2xl px-3.5 py-2 relative ${isMe ? "bg-brand-600 text-white" : "bg-white/[0.06] text-gray-100"}`}
            onDoubleClick={() => setShowReactPicker(true)}
          >
            {msg.replyTo && (
              <div className="text-[11px] opacity-70 border-l-2 border-white/40 pl-2 mb-1 line-clamp-1">Replying to a message</div>
            )}

            {msg.messageType === "sticker" && msg.stickerId && (
              <p className="text-4xl leading-none">🏷️</p>
            )}

            {msg.mediaType === "image" && msg.mediaUrl && (
              <img src={msg.mediaUrl} alt="" onClick={() => onImageClick(msg.mediaUrl)} className="rounded-xl max-w-full max-h-64 object-cover cursor-zoom-in mb-1" />
            )}
            {msg.mediaType === "video" && msg.mediaUrl && (
              <video src={msg.mediaUrl} controls className="rounded-xl max-w-full max-h-64 mb-1" />
            )}
            {msg.mediaType === "voice" && msg.mediaUrl && (
              <audio src={msg.mediaUrl} controls className="max-w-full mb-1" />
            )}
            {msg.mediaType === "file" && msg.mediaUrl && (
              <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2 mb-1 hover:bg-black/30 transition">
                {Icon.file}
                <span className="text-xs truncate flex-1">{msg.fileName}</span>
                <span className="text-[10px] opacity-70">{fmtSize(msg.fileSize || 0)}</span>
              </a>
            )}

            {msg.text && <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>}

            <div className="flex items-center gap-1 justify-end mt-0.5">
              <span className="text-[10px] opacity-60">{fmtTime(msg.createdAt)}</span>
              {isMe && msg.seenBy?.length > 1 && <span className="opacity-80">{Icon.seendbl}</span>}
            </div>

            {msg.reactions?.length > 0 && (
              <div className="absolute -bottom-3 right-2 bg-[#1c1c1e] border border-white/10 rounded-full px-1.5 py-0.5 flex gap-0.5 shadow">
                {msg.reactions.slice(0, 3).map((r, i) => <span key={i} className="text-xs">{r.emoji}</span>)}
                {msg.reactions.length > 3 && <span className="text-[10px] text-gray-400">+{msg.reactions.length - 3}</span>}
              </div>
            )}
          </div>

          {/* Hover action row — reply / react / delete */}
          <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-24" : "-right-24"} hidden group-hover:flex items-center gap-1 bg-[#1c1c1e] border border-white/10 rounded-full px-1.5 py-1 shadow-lg`}>
            <button type="button" onClick={() => onReply(msg)} className="p-1 text-gray-400 hover:text-white transition">{Icon.reply}</button>
            <button
              type="button"
              onClick={() => (myReaction ? onRemoveReaction(msg._id) : setShowReactPicker(true))}
              className="p-1 text-gray-400 hover:text-white transition text-sm"
            >
              {myReaction ? myReaction.emoji : "🙂"}
            </button>
            {(isMe || canDeleteAny) && (
              <button type="button" onClick={() => setShowActions((s) => !s)} className="p-1 text-gray-400 hover:text-red-400 transition">{Icon.trash}</button>
            )}
          </div>

          {showActions && (
            <div className={`absolute z-20 top-full mt-1 ${isMe ? "right-0" : "left-0"} bg-[#1c1c1e] border border-white/10 rounded-xl shadow-xl overflow-hidden text-xs whitespace-nowrap`}>
              <button type="button" onClick={() => { onDeleteMe(msg._id); setShowActions(false); }} className="block w-full text-left px-3 py-2 hover:bg-white/10 transition">Delete for me</button>
              {(isMe || canDeleteAny) && (
                <button type="button" onClick={() => { onDeleteAll(msg._id); setShowActions(false); }} className="block w-full text-left px-3 py-2 hover:bg-white/10 text-red-400 transition">Delete for everyone</button>
              )}
            </div>
          )}
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
function GroupProfileModal({ group, myRole, myId, communityMembers, onClose, onUpdated, onLeftOrDeleted, showToast }) {
  const isAdmin = myRole === "creator" || myRole === "admin";
  const isCreator = myRole === "creator";

  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [messagePermission, setMessagePermission] = useState(group.messagePermission || "all");
  const [busy, setBusy] = useState(false);

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
    const res = await groupApi.updateGroup(group._id, { name, description, messagePermission });
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Group Info</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white">{Icon.x}</button>
        </div>

        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-600 flex items-center justify-center text-2xl font-extrabold">
            {group.avatar ? <img src={group.avatar} alt="" className="w-full h-full object-cover" /> : group.name?.[0]?.toUpperCase() || "G"}
          </div>

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
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={handleSaveEdit} className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
                <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h4 className="text-xl font-bold mt-3">{group.name}</h4>
              {group.description && <p className="text-gray-500 text-sm mt-1">{group.description}</p>}
              <p className="text-xs text-gray-600 mt-2">{group.memberCount} / {group.maxMembers} members · {group.messagePermission === "admins_only" ? "Only admins can chat" : "Everyone can chat"}</p>
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
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineCount, setOnlineCount] = useState(0);
  const [localToast, setLocalToast] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);

  const showToast = parentShowToast || ((msg, type) => {
    setLocalToast({ msg, type });
    setTimeout(() => setLocalToast(null), 3000);
  });

  const isAdminOrCreator = myRole === "creator" || myRole === "admin";
  const canDeleteAny = isAdminOrCreator;

  // ── Load messages + group context ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [msgRes, grpRes, onlineRes] = await Promise.all([
        groupApi.getGroupMessages(group._id),
        groupApi.getGroupById(group._id),
        groupApi.getOnlineGroupMembers(group._id),
      ]);
      if (cancelled) return;
      setMessages((msgRes.messages || []).slice().reverse()); // service returns newest-first, we render oldest->newest
      if (grpRes.success) { setGroup(grpRes.group); setMyRole(grpRes.myRole); }
      setOnlineCount((onlineRes.members || []).filter((m) => m.isOnline).length);
      setLoading(false);
      groupApi.markGroupMessagesSeen(group._id);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group._id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
    if (!text.trim()) return;
    const res = await groupApi.sendGroupMessage(group._id, text.trim(), replyingTo?._id);
    if (res.success) {
      setText("");
      setReplyingTo(null);
    } else {
      showToast(res.msg || "Could not send message", "error");
    }
  };

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const res = await groupApi.sendGroupMediaMessage(group._id, file);
    if (!res.success) showToast(res.msg || "Could not send file", "error");
  };

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
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-navy-900/50 flex-shrink-0">
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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
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
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

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
        ) : (
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilePick} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-400 hover:text-white transition flex-shrink-0">{Icon.attach}</button>
            <input
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            <button type="button" onClick={handleSend} disabled={!text.trim()} className="p-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full transition flex-shrink-0">{Icon.send2}</button>
          </div>
        )}
      </div>

      {showProfile && (
        <GroupProfileModal
          group={group}
          myRole={myRole}
          myId={myId}
          communityMembers={communityMembers}
          onClose={() => setShowProfile(false)}
          onUpdated={(updatedGroup) => setGroup(updatedGroup)}
          onLeftOrDeleted={() => { setShowProfile(false); onClose(); }}
          showToast={showToast}
        />
      )}

      {enlargedImage && <ImageModal src={enlargedImage} name={group.name} onClose={() => setEnlargedImage(null)} />}
    </div>
  );
}