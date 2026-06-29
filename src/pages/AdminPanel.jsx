// src/pages/AdminPanel.jsx
// Community Admin Panel — for owner & principal only
// Endpoints: /api/admin/* and /api/createcollege/*

import { useEffect, useState, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-[300] px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl border ${
      toast.type === "error"
        ? "bg-red-950 border-red-500/40 text-red-300"
        : toast.type === "warning"
          ? "bg-yellow-950 border-yellow-500/40 text-yellow-300"
          : "bg-green-950 border-green-500/40 text-green-300"
    }`}>
      {toast.msg}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onCancel}>
      <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-semibold transition">Cancel</button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition ${danger ? "bg-red-600 hover:bg-red-500" : "bg-purple-600 hover:bg-purple-500"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Role Change Modal ────────────────────────────────────────────────────────
function RoleModal({ member, onClose, onSuccess, showToast, isOwner }) {
  const [role, setRole]       = useState(member.role);
  const [loading, setLoading] = useState(false);

  const ROLES = isOwner
    ? ["student", "teacher", "hod", "principal"]
    : ["student", "teacher"]; // principal can only change student/teacher

  const handleSave = async () => {
    if (role === member.role) { onClose(); return; }
    setLoading(true);
    try {
      await api.patch("/api/admin/update-role", {
        targetUserId: member.userId?._id || member.userId,
        newRole: role,
      });
      showToast(`Role updated to ${role}`, "success");
      onSuccess();
    } catch (e) {
      showToast(e?.response?.data?.msg || "Role update failed", "error");
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const ROLE_META = {
    student:   { emoji: "🎓", desc: "Regular community member" },
    teacher:   { emoji: "📚", desc: "Can post announcements and resources" },
    hod:       { emoji: "🏛️", desc: "Head of Department — manages a department" },
    principal: { emoji: "👑", desc: "Co-admin with elevated permissions" },
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Change Role</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">×</button>
        </div>
        <p className="text-gray-500 text-sm mb-4">
          Changing role for <span className="text-white font-semibold">{member.userId?.fullName || "this member"}</span>
        </p>
        <div className="space-y-2 mb-5">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition ${
                role === r
                  ? "border-purple-500 bg-purple-600/15 text-white"
                  : "border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/15 hover:text-white"
              }`}
            >
              <span className="text-xl">{ROLE_META[r].emoji}</span>
              <div>
                <p className="font-semibold capitalize text-sm">{r}</p>
                <p className="text-xs text-gray-500">{ROLE_META[r].desc}</p>
              </div>
              {role === r && <span className="ml-auto text-purple-400">✓</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold transition hover:text-white">Cancel</button>
          <button onClick={handleSave} disabled={loading || role === member.role}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm font-bold transition">
            {loading ? "Saving..." : "Save Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
const ROLE_STYLE = {
  owner:     "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  principal: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  hod:       "bg-teal-500/15 text-teal-300 border-teal-500/30",
  teacher:   "bg-green-500/15 text-green-300 border-green-500/30",
  student:   "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

function RoleBadge({ role }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${ROLE_STYLE[role] || ROLE_STYLE.student}`}>
      {role}
    </span>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────
function MemberRow({ member, myRole, myId, onKick, onRoleChange }) {
  const userId   = member.userId?._id || member.userId;
  const isSelf   = String(userId) === String(myId);
  const isOwner  = member.role === "owner";
  const canEdit  = !isSelf && !isOwner;

  return (
    <div className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/6 rounded-2xl px-4 py-3 transition">
      <img
        src={member.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.userId?.fullName || "U")}&background=7c3aed&color=fff&bold=true`}
        alt={member.userId?.fullName}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm truncate">{member.userId?.fullName || "—"}</p>
          {isSelf && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400">You</span>}
        </div>
        <p className="text-xs text-gray-500">@{member.userId?.username || "—"} · {member.department || "General"}</p>
      </div>
      <RoleBadge role={member.role} />
      {canEdit && (
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => onRoleChange(member)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white text-xs font-semibold transition"
          >
            Role
          </button>
          <button
            onClick={() => onKick(member)}
            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold transition"
          >
            Kick
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ADMIN PANEL ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, collegeStatus } = useContext(AuthContext);
  const navigate = useNavigate();

  const [members,  setMembers]  = useState([]);
  const [college,  setCollege]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toast,    setToast]    = useState(null);
  const [confirm,  setConfirm]  = useState(null);  // { member } for kick confirm
  const [roleModal, setRoleModal] = useState(null); // member for role change
  const [copied,   setCopied]   = useState(false);
  const searchTimer              = useRef(null);

  const isOwner = collegeStatus?.isOwner;
  const myId    = user?._id;

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Access guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!collegeStatus) return;
    if (!["owner", "principal"].includes(collegeStatus.role)) {
      navigate("/profile");
    }
  }, [collegeStatus, navigate]);

  // ── Fetch college info ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/api/createcollege/my-college");
        setCollege(r.data.college);
      } catch (e) {
        showToast("Could not load college info", "error");
      }
    })();
  }, [showToast]);

  // ── Fetch members ────────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async (s = search, r = roleFilter) => {
    setLoading(true);
    try {
      // Use the working endpoint from college_owner_controller: /api/createcollege/my-college
      // which returns members via getCollegeMembersService
      const res = await api.get("/api/createcollege/my-college", {
        params: { search: s, role: r },
      });
      setMembers(res.data.members || []);
    } catch (e) {
      showToast("Could not load members", "error");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, showToast]);

  useEffect(() => { fetchMembers(); }, []); // eslint-disable-line

  // Debounced search
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchMembers(val, roleFilter), 400);
  };

  // ── Kick member ──────────────────────────────────────────────────────────────
  const handleKick = async () => {
    const member = confirm.member;
    const targetUserId = member.userId?._id || member.userId;
    try {
      await api.post("/api/admin/kick-user", {
        memberId:     member._id,
        targetUserId,
        reason:       "Removed by admin",
      });
      showToast("Member removed", "success");
      setMembers((prev) => prev.filter((m) => m._id !== member._id));
    } catch (e) {
      showToast(e?.response?.data?.msg || "Could not remove member", "error");
    } finally {
      setConfirm(null);
    }
  };

  // ── Copy invite code ─────────────────────────────────────────────────────────
  const copyInviteCode = () => {
    if (!college?.invite_code) return;
    navigator.clipboard.writeText(college.invite_code);
    setCopied(true);
    showToast("Invite code copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const ROLE_FILTERS = ["", "student", "teacher", "hod", "principal", "owner"];

  // Member counts by role
  const counts = members.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {});

  const filteredMembers = members.filter((m) => {
    const name = m.userId?.fullName?.toLowerCase() || "";
    const uname = m.userId?.username?.toLowerCase() || "";
    const q = search.toLowerCase();
    const matchSearch = !search || name.includes(q) || uname.includes(q);
    const matchRole   = !roleFilter || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (!collegeStatus || !["owner", "principal"].includes(collegeStatus.role)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-16">
      <Toast toast={toast} />

      {/* Confirm dialog */}
      {confirm && !confirm.type && confirm.member && (
        <ConfirmDialog
          title="Remove Member"
          message={`Remove ${confirm.member.userId?.fullName || "this member"} from the community? They will lose access immediately.`}
          confirmLabel="Remove"
          danger
          onConfirm={handleKick}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Role change modal */}
      {roleModal && (
        <RoleModal
          member={roleModal}
          isOwner={isOwner}
          onClose={() => setRoleModal(null)}
          onSuccess={() => fetchMembers()}
          showToast={showToast}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => navigate("/profile")} className="text-gray-600 hover:text-white text-sm transition">← Profile</button>
              <span className="text-gray-700">/</span>
              <span className="text-gray-400 text-sm">Admin Panel</span>
            </div>
            <h1 className="text-2xl font-extrabold">Admin Panel</h1>
            {college && <p className="text-gray-500 text-sm mt-0.5">{college.college_name}</p>}
          </div>
          {isOwner && (
            <span className="px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-bold">
              ⚙️ Owner
            </span>
          )}
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Members", value: college?.usageCount ?? members.length, icon: "👥" },
            { label: "Students",      value: counts.student  || 0, icon: "🎓" },
            { label: "Teachers",      value: (counts.teacher || 0) + (counts.hod || 0), icon: "📚" },
            { label: "Capacity",      value: `${college?.usageCount || 0}/${college?.usageLimit || 1000}`, icon: "📊" },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-3">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Invite code (owner only) ─────────────────────────────────────── */}
        {isOwner && college?.invite_code && (
          <div className="bg-purple-950/30 border border-purple-500/25 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-1">Invite Code</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-white">{college.invite_code}</p>
              <p className="text-gray-500 text-xs mt-0.5">Share this with students to join your community</p>
            </div>
            <button
              onClick={copyInviteCode}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${copied ? "bg-green-600 text-white" : "bg-purple-600 hover:bg-purple-500 text-white"}`}
            >
              {copied ? "✓ Copied!" : "📋 Copy Code"}
            </button>
          </div>
        )}

        {/* ── Community Info (owner only) ──────────────────────────────────── */}
        {isOwner && college && (
          <div className="bg-white/[0.02] border border-white/6 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Community Info</p>
              <button
                onClick={() => navigate(`/community/${college._id}`)}
                className="text-xs text-purple-400 hover:text-purple-300 transition"
              >
                Open Community →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <InfoItem label="Status" value={college.status || "active"} />
              <InfoItem label="Category" value={college.category || "—"} />
              <InfoItem label="Privacy" value={college.isprivate ? "Private 🔒" : "Public 🌐"} />
              <InfoItem label="University" value={college.university} />
              <InfoItem label="Created" value={new Date(college.createdAt).toLocaleDateString()} />
            </div>
          </div>
        )}

        {/* ── Members table ────────────────────────────────────────────────── */}
        <div className="bg-white/[0.02] border border-white/6 rounded-3xl overflow-hidden">

          {/* Table header */}
          <div className="px-5 py-4 border-b border-white/6 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <h2 className="font-bold text-base">Members</h2>
              <p className="text-gray-600 text-xs mt-0.5">{filteredMembers.length} shown</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Search */}
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search name..."
                className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition w-40"
              />
              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); fetchMembers(search, e.target.value); }}
                className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-gray-300 outline-none focus:border-purple-500 transition cursor-pointer"
              >
                <option value="">All Roles</option>
                {ROLE_FILTERS.filter(Boolean).map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Member list */}
          <div className="p-4 space-y-2">
            {loading && (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && filteredMembers.length === 0 && (
              <p className="text-center text-gray-600 py-12 text-sm">
                {search || roleFilter ? "No members match your filter." : "No members yet."}
              </p>
            )}
            {!loading && filteredMembers.map((m) => (
              <MemberRow
                key={m._id}
                member={m}
                myRole={collegeStatus?.role}
                myId={myId}
                onKick={(member) => setConfirm({ member })}
                onRoleChange={(member) => setRoleModal(member)}
              />
            ))}
          </div>
        </div>

        {/* ── Danger zone (owner only) ─────────────────────────────────────── */}
        {isOwner && (
          <div className="border border-red-500/20 rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-red-500/15">
              <h2 className="font-bold text-red-400">Danger Zone</h2>
              <p className="text-gray-500 text-xs mt-0.5">These actions are permanent and cannot be undone.</p>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <p className="font-semibold text-sm">Delete Community</p>
                  <p className="text-gray-500 text-xs">Permanently remove this community and all its members.</p>
                </div>
                <button
                  onClick={() => setConfirm({ type: "delete" })}
                  className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Delete community confirm */}
      {confirm?.type === "delete" && (
        <ConfirmDialog
          title="Delete Community?"
          message={`This will permanently delete "${college?.college_name}" and remove all ${college?.usageCount || 0} members. This cannot be undone.`}
          confirmLabel="Yes, Delete"
          danger
          onConfirm={async () => {
            try {
              await api.delete(`/api/createcollege/${college._id}`);
              showToast("Community deleted", "success");
              setTimeout(() => navigate("/"), 1500);
            } catch (e) {
              showToast(e?.response?.data?.msg || "Delete failed", "error");
            }
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-gray-600 text-[10px] uppercase font-semibold tracking-wide">{label}</p>
      <p className="text-white text-sm mt-0.5 font-medium">{value}</p>
    </div>
  );
}