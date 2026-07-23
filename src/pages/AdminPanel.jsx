import { useEffect, useState, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { getRoleDisplay } from "../lib/roleTiers";

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-[300] px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl border transition-all ${
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-md" onClick={onCancel}>
      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-semibold transition">Cancel</button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition ${
              danger ? "bg-red-600 hover:bg-red-500" : "bg-brand-600 hover:bg-brand-500"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Modal ────────────────────────────────────────────────────────────
function ProfileModal({ member, onClose, onKick, onRoleChange, onSuspend, myId, isOwner }) {
  const userId   = member.userId?._id || member.userId;
  const isSelf   = String(userId) === String(myId);
  const isOwnerRole = member.role === "owner";
  const canEdit  = !isSelf && !isOwnerRole;
  const name     = member.userId?.fullName || member.userId?.username || "Unknown";
  const avatar   = member.userId?.avatar;
  const initials = name.slice(0, 2).toUpperCase();
  const isSuspended = member.status === "suspended";

  const ROLE_COLORS = {
    owner: "bg-yellow-500/20 text-yellow-300",
    principal: "bg-blue-500/20 text-blue-300",
    hod: "bg-teal-500/20 text-teal-300",
    teacher: "bg-green-500/20 text-green-300",
    student: "bg-brand-500/20 text-brand-300",
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-md" onClick={onClose}>
      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">Member Profile</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Avatar + Info */}
        <div className="flex flex-col items-center mb-6">
          {avatar ? (
            <img src={avatar} alt={name} className="w-20 h-20 rounded-full object-cover border-2 border-brand-500 mb-3" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand-700 flex items-center justify-center text-2xl font-bold text-white mb-3">
              {initials}
            </div>
          )}
          <p className="text-white font-bold text-lg">{name}</p>
          <p className="text-gray-500 text-sm">@{member.userId?.username || "—"}</p>
          <p className="text-gray-500 text-xs mt-1">{member.userId?.email || "—"}</p>
          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${ROLE_COLORS[member.role] || ROLE_COLORS.student}`}>
              {member.role}
            </span>
            {member.department && (
              <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-gray-300">
                {member.department}
              </span>
            )}
            {isSuspended && (
              <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-300">Suspended</span>
            )}
          </div>
          <p className="text-gray-600 text-xs mt-2">
            Joined {new Date(member.joinedAt || member.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Actions */}
        {canEdit ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { onClose(); onRoleChange(member); }}
              className="w-full py-2.5 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-300 hover:bg-brand-600/30 text-sm font-semibold transition"
            >
              Change Role
            </button>
            <button
              onClick={() => { onClose(); onSuspend(member); }}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                isSuspended
                  ? "bg-green-600/20 border border-green-500/30 text-green-300 hover:bg-green-600/30"
                  : "bg-yellow-600/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-600/30"
              }`}
            >
              {isSuspended ? "Unsuspend Member" : "Suspend Member"}
            </button>
            <button
              onClick={() => { onClose(); onKick(member); }}
              className="w-full py-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 text-sm font-semibold transition"
            >
              Kick Member
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-600 text-xs">
            {isSelf ? "This is you." : "Owner role cannot be modified."}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Role Modal ───────────────────────────────────────────────────────────────
function RoleModal({ member, onClose, onSuccess, showToast, isOwner }) {
  const [role, setRole]       = useState(member.role);
  const [loading, setLoading] = useState(false);

  const ROLES = isOwner
    ? ["student", "teacher", "hod", "principal"]
    : ["student", "teacher"];

  const ROLE_META = {
    student:   { emoji: "🎓", desc: "Regular community member" },
    teacher:   { emoji: "📚", desc: "Can post announcements and resources" },
    hod:       { emoji: "🏛️", desc: "Head of Department — manages a department" },
    principal: { emoji: "👑", desc: "Co-admin with elevated permissions" },
  };

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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-md" onClick={onClose}>
      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Change Role</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
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
                  ? "border-brand-500 bg-brand-600/15 text-white"
                  : "border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <span className="text-xl">{ROLE_META[r].emoji}</span>
              <div>
                <p className="font-semibold capitalize text-sm">{r}</p>
                <p className="text-xs text-gray-500">{ROLE_META[r].desc}</p>
              </div>
              {role === r && <span className="ml-auto text-brand-400">✓</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white transition">Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading || role === member.role}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-bold transition"
          >
            {loading ? "Saving..." : "Save Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
const ROLE_STYLE = {
  owner:     "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  principal: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  hod:       "bg-teal-500/15 text-teal-300 border-teal-500/30",
  teacher:   "bg-green-500/15 text-green-300 border-green-500/30",
  student:   "bg-brand-500/15 text-brand-300 border-brand-500/30",
};

function RoleBadge({ role }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${ROLE_STYLE[role] || ROLE_STYLE.student}`}>
      {getRoleDisplay(role)}
    </span>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────
function MemberRow({ member, myId, onViewProfile }) {
  const name     = member.userId?.fullName || member.userId?.username || "Unknown";
  const avatar   = member.userId?.avatar;
  const initials = name.slice(0, 2).toUpperCase();
  const isSelf   = String(member.userId?._id || member.userId) === String(myId);
  const isSuspended = member.status === "suspended";

  return (
    <div
      onClick={() => onViewProfile(member)}
      className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/6 rounded-2xl px-4 py-3 transition cursor-pointer group"
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-white/10" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm truncate text-white">{name}</p>
          {isSelf && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400">You</span>}
          {isSuspended && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Suspended</span>}
        </div>
        <p className="text-xs text-gray-500">@{member.userId?.username || "—"} · {member.department || "General"}</p>
      </div>
      <div className="flex items-center gap-2">
        <RoleBadge role={member.role} />
        <span className="text-gray-700 group-hover:text-gray-400 text-xs transition">→</span>
      </div>
    </div>
  );
}
function EditCommunityModal({ college, onClose, onSuccess, showToast }) {
  const [form, setForm] = useState({
    college_name: college?.college_name || "",
    description:  college?.description  || "",
    university:   college?.university   || "",
  });
  const [logoFile,   setLogoFile]   = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview,   setLogoPreview]   = useState(college?.logo_url   || null);
  const [bannerPreview, setBannerPreview] = useState(college?.banner_url || null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(preview);
    } else {
      setBannerFile(file);
      setBannerPreview(preview);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("college_name", form.college_name);
      formData.append("description",  form.description);
      formData.append("university",   form.university);
      if (logoFile)   formData.append("logo",   logoFile);
      if (bannerFile) formData.append("banner", bannerFile);

      await api.put(`/api/createcollege/${college._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Community updated", "success");
      onSuccess();
    } catch (e) {
      showToast(e?.response?.data?.msg || "Update failed", "error");
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-md" onClick={onClose}>
      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Edit Community</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        {/* Banner Preview */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-2 block">Banner Image</label>
          <div
            className="w-full h-24 rounded-xl border border-white/10 bg-white/5 overflow-hidden relative cursor-pointer group"
            onClick={() => document.getElementById("banner-upload").click()}
          >
            {bannerPreview ? (
              <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">Click to upload banner</div>
            )}
            <div className="absolute inset-0 bg-navy-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition">
              Change Banner
            </div>
          </div>
          <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "banner")} />
        </div>

        {/* Logo Preview */}
        <div className="mb-4 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full border border-white/10 bg-white/5 overflow-hidden relative cursor-pointer group flex-shrink-0"
            onClick={() => document.getElementById("logo-upload").click()}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl font-bold">
                {college?.college_name?.[0]?.toUpperCase() || "C"}
              </div>
            )}
            <div className="absolute inset-0 bg-navy-900/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition">
              Change
            </div>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{form.college_name || "Community"}</p>
            <button
              onClick={() => document.getElementById("logo-upload").click()}
              className="text-brand-400 text-xs hover:text-brand-300 transition mt-0.5"
            >
              Upload Logo
            </button>
          </div>
          <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "logo")} />
        </div>

        {/* Text Fields */}
        <div className="space-y-3 mb-5">
          {[
            { label: "College Name", key: "college_name" },
            { label: "University",   key: "university" },
            { label: "Description",  key: "description" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              {key === "description" ? (
                <textarea
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-brand-500 transition resize-none"
                />
              ) : (
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-brand-500 transition"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-bold transition">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── MAIN ADMIN PANEL ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, collegeStatus } = useContext(AuthContext);
  const navigate = useNavigate();

  const [members,      setMembers]      = useState([]);
  const [college,      setCollege]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("");
  const [toast,        setToast]        = useState(null);
  const [confirm,      setConfirm]      = useState(null);
  const [roleModal,    setRoleModal]    = useState(null);
  const [profileModal, setProfileModal] = useState(null);
  const [editModal,    setEditModal]    = useState(false);
  const [copied,       setCopied]       = useState(false);
  const searchTimer                      = useRef(null);

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
  const fetchCollege = useCallback(async () => {
    try {
      const r = await api.get("/api/createcollege/my-college");
      setCollege(r.data.college);
    } catch (e) {
      showToast("Could not load college info", "error");
    }
  }, [showToast]);

  useEffect(() => { fetchCollege(); }, [fetchCollege]);

  // ── Fetch members ─────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async (s = search, r = roleFilter) => {
    setLoading(true);
    try {
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
        targetUserId,
        reason: "Removed by admin",
      });
      showToast("Member removed", "success");
      setMembers((prev) => prev.filter((m) => (m.userId?._id || m.userId) !== targetUserId));
    } catch (e) {
      showToast(e?.response?.data?.msg || "Could not remove member", "error");
    } finally {
      setConfirm(null);
    }
  };

  // ── Suspend / Unsuspend ──────────────────────────────────────────────────────
  const handleSuspend = async () => {
    const member       = confirm.suspendMember;
    const targetUserId = member.userId?._id || member.userId;
    const isSuspended  = member.status === "suspended";
    try {
      await api.patch("/api/admin/update-role", {
        targetUserId,
        newRole: member.role,
        status: isSuspended ? "active" : "suspended",
      });
      showToast(isSuspended ? "Member unsuspended" : "Member suspended", "success");
      fetchMembers();
    } catch (e) {
      showToast(e?.response?.data?.msg || "Could not update status", "error");
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

  const filteredMembers = members.filter((m) => {
    const name  = m.userId?.fullName?.toLowerCase() || "";
    const uname = m.userId?.username?.toLowerCase()  || "";
    const q     = search.toLowerCase();
    return (!search || name.includes(q) || uname.includes(q)) &&
           (!roleFilter || m.role === roleFilter);
  });

  const counts = members.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {});

  if (!collegeStatus || !["owner", "principal"].includes(collegeStatus.role)) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white pt-20 px-4 pb-16">
      <Toast toast={toast} />

      {/* Kick confirm */}
      {confirm?.member && !confirm?.suspendMember && !confirm?.type && (
        <ConfirmDialog
          title="Remove Member"
          message={`Remove ${confirm.member.userId?.fullName || "this member"} from the community? They will lose access immediately.`}
          confirmLabel="Remove"
          danger
          onConfirm={handleKick}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Suspend confirm */}
      {confirm?.suspendMember && (
        <ConfirmDialog
          title={confirm.suspendMember.status === "suspended" ? "Unsuspend Member?" : "Suspend Member?"}
          message={
            confirm.suspendMember.status === "suspended"
              ? `Restore access for ${confirm.suspendMember.userId?.fullName || "this member"}?`
              : `Suspend ${confirm.suspendMember.userId?.fullName || "this member"}? They won't be able to access the community.`
          }
          confirmLabel={confirm.suspendMember.status === "suspended" ? "Unsuspend" : "Suspend"}
          danger={confirm.suspendMember.status !== "suspended"}
          onConfirm={handleSuspend}
          onCancel={() => setConfirm(null)}
        />
      )}

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

      {/* Role modal */}
      {roleModal && (
        <RoleModal
          member={roleModal}
          isOwner={isOwner}
          onClose={() => setRoleModal(null)}
          onSuccess={() => fetchMembers()}
          showToast={showToast}
        />
      )}

      {/* Profile modal */}
      {profileModal && (
        <ProfileModal
          member={profileModal}
          myId={myId}
          isOwner={isOwner}
          onClose={() => setProfileModal(null)}
          onKick={(m) => { setProfileModal(null); setConfirm({ member: m }); }}
          onRoleChange={(m) => { setProfileModal(null); setRoleModal(m); }}
          onSuspend={(m) => { setProfileModal(null); setConfirm({ suspendMember: m }); }}
        />
      )}

      {/* Edit community modal */}
      {editModal && (
        <EditCommunityModal
          college={college}
          onClose={() => setEditModal(false)}
          onSuccess={() => { fetchCollege(); fetchMembers(); }}
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
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => setEditModal(true)}
                className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-white/20 text-xs font-semibold transition"
              >
                ✏️ Edit Community
              </button>
            )}
            {isOwner && (
              <span className="px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-bold">
                ⚙️ Owner
              </span>
            )}
          </div>
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
          <div className="bg-brand-950/30 border border-brand-500/25 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-brand-400 text-[10px] font-bold uppercase tracking-widest mb-1">Invite Code</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-white">{college.invite_code}</p>
              <p className="text-gray-500 text-xs mt-0.5">Share with students to join</p>
            </div>
            <button
              onClick={copyInviteCode}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                copied ? "bg-green-600 text-white" : "bg-brand-600 hover:bg-brand-500 text-white"
              }`}
            >
              {copied ? "✓ Copied!" : "📋 Copy Code"}
            </button>
          </div>
        )}

        {/* ── Community Info ───────────────────────────────────────────────── */}
        {college && (
          <div className="bg-white/[0.02] border border-white/6 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Community Info</p>
              <button
                onClick={() => navigate(`/community/${college._id}`)}
                className="text-xs text-brand-400 hover:text-brand-300 transition"
              >
                Open Community →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <InfoItem label="Status"     value={college.status || "active"} />
              <InfoItem label="Privacy"    value={college.isprivate ? "Private 🔒" : "Public 🌐"} />
              <InfoItem label="University" value={college.university} />
              <InfoItem label="Created"    value={new Date(college.createdAt).toLocaleDateString()} />
              <InfoItem label="Members"    value={`${college.usageCount} / ${college.usageLimit}`} />
            </div>
          </div>
        )}

        {/* ── Members table ────────────────────────────────────────────────── */}
        <div className="bg-white/[0.02] border border-white/6 rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <h2 className="font-bold text-base">Members</h2>
              <p className="text-gray-600 text-xs mt-0.5">{filteredMembers.length} shown · click to view profile</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search name..."
                className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500 transition w-40"
              />
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); fetchMembers(search, e.target.value); }}
                className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-gray-300 outline-none focus:border-brand-500 transition cursor-pointer"
              >
                <option value="">All Roles</option>
                {["student", "teacher", "hod", "principal", "owner"].map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {loading && (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
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
                myId={myId}
                onViewProfile={(member) => setProfileModal(member)}
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