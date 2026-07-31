// src/components/CreateGroupModal.jsx
import { useState, useRef } from "react";
import { createGroup, uploadGroupAvatar } from "../lib/group.api";

export default function CreateGroupModal({ onClose, onCreated, showToast }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  const handlePickAvatar = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!name.trim()) { showToast("Group name is required", "error"); return; }
    setBusy(true);

    const res = await createGroup({ name: name.trim(), description: description.trim() });
    if (!res.success) {
      setBusy(false);
      showToast(res.msg || "Could not create group", "error");
      return;
    }

    let finalGroup = res.group;

    // Avatar upload zaroori groupId ke baad hi ho sakta (R2 path groupId
    // se banta hai) — isliye create ke turant baad, agar photo select ki
    // thi to wo upload karke group object update kar dete hain.
    if (avatarFile) {
      const avatarRes = await uploadGroupAvatar(finalGroup._id, avatarFile);
      if (avatarRes.success) {
        finalGroup = avatarRes.group;
      } else {
        showToast(avatarRes.msg || "Group created, but photo upload failed", "error");
      }
    }

    setBusy(false);
    showToast("Group created!");
    onCreated(finalGroup);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">Create Group</h3>

        <div className="flex justify-center mb-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-2xl overflow-hidden bg-brand-600 flex items-center justify-center text-2xl font-extrabold group"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              name?.[0]?.toUpperCase() || "G"
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-semibold transition">
              {avatarPreview ? "Change" : "Add Photo"}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickAvatar} />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Group Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g. CS Batch 2026"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What's this group about?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition">Cancel</button>
          <button type="button" disabled={busy || !name.trim()} onClick={handleCreate} className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition">
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}