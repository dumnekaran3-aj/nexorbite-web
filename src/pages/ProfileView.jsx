import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import MarketplaceQuickLinks from "../components/digitalproducts/MarketplaceQuickLinks";

// ─── Image Modal ──────────────────────────────────────────────────────────────
function ImageModal({ src, name, onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <img
        src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=7c3aed&color=fff&bold=true&size=256`}
        alt={name}
        className="w-72 h-72 rounded-full object-cover border-4 border-purple-500 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-[300] px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl border ${
      toast.type === "error"   ? "bg-red-950 border-red-500/40 text-red-300"
      : toast.type === "warning" ? "bg-yellow-950 border-yellow-500/40 text-yellow-300"
      : "bg-green-950 border-green-500/40 text-green-300"
    }`}>
      {toast.msg}
    </div>
  );
}

// ─── Create Community Modal ───────────────────────────────────────────────────
function CreateCommunityModal({ onClose, onSuccess, showToast }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    college_name: "", college_email: "", university: "",
    description: "", category: "General", isprivate: false, tags: "",
  });
  const [logo, setLogo]     = useState(null);
  const [banner, setBanner] = useState(null);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validateStep1 = () => {
    const e = {};
    if (!form.college_name.trim())  e.college_name  = "Community name required";
    if (!form.college_email.trim()) e.college_email = "Email required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.college_email)) e.college_email = "Valid email required";
    if (!form.university.trim())    e.university    = "University name required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.description.trim())       e.description = "Description required";
    if (form.description.length > 1000) e.description = "Max 1000 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "tags") {
          v.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => fd.append("tags", t));
        } else {
          fd.append(k, v);
        }
      });
      if (logo)   fd.append("logo",   logo);
      if (banner) fd.append("banner", banner);
      await api.post("/api/createcollege", fd, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("Community created! 🎉", "success");
      onSuccess();
    } catch (e) {
      showToast(e?.response?.data?.msg || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const CATS = ["General","Tech","Arts","Sports","Science","Business","Medical","Law","Other"];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#0d0d0d] border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8">
          <div>
            <h2 className="text-xl font-bold">Create Community</h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition text-lg">×</button>
        </div>
        <div className="h-0.5 bg-white/5"><div className="h-full bg-purple-600 transition-all" style={{ width: step === 1 ? "50%" : "100%" }} /></div>
        <div className="px-6 py-5 space-y-4">
          {step === 1 && (<>
            <Field label="Community Name *" error={errors.college_name}>
              <input value={form.college_name} onChange={(e) => set("college_name", e.target.value)} placeholder="e.g. MIT Engineering Hub" className={iCls(errors.college_name)} />
            </Field>
            <Field label="Official Email *" error={errors.college_email}>
              <input type="email" value={form.college_email} onChange={(e) => set("college_email", e.target.value)} placeholder="college@university.edu" className={iCls(errors.college_email)} />
            </Field>
            <Field label="University / Institution *" error={errors.university}>
              <input value={form.university} onChange={(e) => set("university", e.target.value)} placeholder="e.g. MIT" className={iCls(errors.university)} />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={iCls()}>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => set("isprivate", !form.isprivate)} className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors ${form.isprivate ? "bg-purple-600" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isprivate ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-gray-300">Private community <span className="text-gray-600">(invite-only)</span></span>
            </label>
          </>)}
          {step === 2 && (<>
            <Field label="Description *" error={errors.description}>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What is this community about?" rows={4} className={iCls(errors.description) + " resize-none"} />
              <p className="text-xs text-gray-600 mt-1">{form.description.length}/1000</p>
            </Field>
            <Field label="Tags (comma separated)" hint="Helps members discover your community">
              <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="engineering, python, hackathon" className={iCls()} />
            </Field>
            <Field label="Community Logo" hint="Optional PNG/JPG">
              <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])} className="text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/40 cursor-pointer" />
              {logo && <p className="text-xs text-green-400 mt-1">✓ {logo.name}</p>}
            </Field>
            <Field label="Banner Image" hint="Optional wide image">
              <input type="file" accept="image/*" onChange={(e) => setBanner(e.target.files[0])} className="text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/40 cursor-pointer" />
              {banner && <p className="text-xs text-green-400 mt-1">✓ {banner.name}</p>}
            </Field>
          </>)}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={step === 1 ? onClose : () => setStep(1)} className="flex-1 py-3 rounded-2xl border border-white/10 text-gray-400 hover:text-white text-sm font-semibold transition">
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          <button onClick={() => { if (step === 1) { if (validateStep1()) setStep(2); } else handleSubmit(); }}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold transition flex items-center justify-center gap-2">
            {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</> : step === 1 ? "Next →" : "Create 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Join Modal ───────────────────────────────────────────────────────────────
function JoinCommunityModal({ onClose, onSuccess, showToast }) {
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleJoin = async () => {
    if (!code.trim()) { setError("Invite code required"); return; }
    setError(""); setLoading(true);
    try {
      await api.post("/api/createcollege/join", { invite_code: code.trim().toUpperCase() });
      showToast("Joined community! 🎉", "success");
      onSuccess();
    } catch (e) {
      setError(e?.response?.data?.msg || "Invalid or expired code");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#0d0d0d] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8">
          <h2 className="text-xl font-bold">Join a Community</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition text-lg">×</button>
        </div>
        <div className="px-6 py-5">
          <p className="text-gray-500 text-sm mb-4">Enter the invite code shared by your community admin.</p>
          <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="e.g. ABC123XY" maxLength={12}
            className={`w-full bg-white/5 border ${error ? "border-red-500/50" : "border-white/10"} rounded-2xl px-4 py-3 text-white text-center text-xl font-mono tracking-widest placeholder-gray-600 outline-none focus:border-purple-500 transition`} />
          {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
          <p className="text-gray-600 text-xs mt-3 text-center">Ask your college admin for the invite code</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-white/10 text-gray-400 hover:text-white text-sm font-semibold transition">Cancel</button>
          <button onClick={handleJoin} disabled={loading || !code.trim()}
            className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold transition flex items-center justify-center gap-2">
            {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Joining...</> : "Join →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const iCls = (err) => `w-full bg-white/5 border ${err ? "border-red-500/50" : "border-white/8"} rounded-2xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-purple-500 transition`;
function Field({ label, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {hint  && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
const ROLE_STYLE = {
  owner:     "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  principal: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  hod:       "bg-teal-500/15 text-teal-300 border-teal-500/30",
  teacher:   "bg-green-500/15 text-green-300 border-green-500/30",
  student:   "bg-purple-500/15 text-purple-300 border-purple-500/30",
};
function RoleBadge({ role }) {
  return <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wide ${ROLE_STYLE[role] || ROLE_STYLE.student}`}>{role}</span>;
}

// ─── MAIN PROFILE VIEW ────────────────────────────────────────────────────────
export default function ProfileView() {
  const { user, collegeStatus, refreshCollegeStatus } = useContext(AuthContext);
  const navigate = useNavigate();

  const [enlargeAvatar, setEnlargeAvatar] = useState(false);
  const [showCreate,    setShowCreate]    = useState(false);
  const [showJoin,      setShowJoin]      = useState(false);
  const [toast,         setToast]         = useState(null);
  const [copied,        setCopied]        = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCommunitySuccess = async () => {
    setShowCreate(false);
    setShowJoin(false);
    if (typeof refreshCollegeStatus === "function") {
      await refreshCollegeStatus();
    } else {
      setTimeout(() => window.location.reload(), 1200);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(collegeStatus?.inviteCode || "");
    setCopied(true);
    showToast("Invite code copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Derive status from collegeStatus ──────────────────────────────────────
  const isJoined = collegeStatus?.isJoined === true;
  const role     = collegeStatus?.role;          // "owner" | "principal" | "student" | etc.
  const isOwner  = collegeStatus?.isOwner === true;
  const isAdmin  = isOwner || role === "principal"; // owner ya principal

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-16">
      <Toast toast={toast} />

      {showCreate && <CreateCommunityModal onClose={() => setShowCreate(false)} onSuccess={handleCommunitySuccess} showToast={showToast} />}
      {showJoin   && <JoinCommunityModal   onClose={() => setShowJoin(false)}   onSuccess={handleCommunitySuccess} showToast={showToast} />}

      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Profile card ─────────────────────────────────────────────── */}
        <div className="bg-white/[0.03] border border-white/8 rounded-3xl overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-purple-900/50 via-purple-800/20 to-transparent" />
          <div className="px-6 pb-6 -mt-12">
            <button onClick={() => setEnlargeAvatar(true)} className="cursor-zoom-in hover:scale-105 transition block">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username || "U")}&background=7c3aed&color=fff&bold=true`}
                alt={user.fullName}
                className="w-24 h-24 rounded-full border-4 border-black object-cover ring-2 ring-purple-500"
              />
            </button>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">{user.fullName}</h2>
                <p className="text-gray-500 text-sm">@{user.username}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {user.isVerified && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold">✓ Verified</span>
                  )}
                  {role && <RoleBadge role={role} />}
                </div>
              </div>
              <Link to="/profile-setup" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-xs font-semibold transition">
                ✏️ Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* ── Info cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard label="Email"           value={user.email}          />
          <InfoCard label="Stream / Branch" value={user.stream || "Not set"} />
          {user.bio && (
            <div className="col-span-full bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-3">
              <p className="text-gray-500 text-[10px] uppercase font-semibold tracking-wide mb-1">Bio</p>
              <p className="text-sm text-gray-300 leading-relaxed">{user.bio}</p>
            </div>
          )}
        </div>

        {/* ── Marketplace quick links (Sell / My Products / My Library) ─── */}
        <MarketplaceQuickLinks />

        {/* ── Community section ─────────────────────────────────────────── */}
        {isJoined ? (
          <div className="space-y-3">

            {/* Community card */}
            <div
              onClick={() => navigate(`/community/${collegeStatus.collegeId}`)}
              className="bg-purple-950/30 border border-purple-500/25 rounded-3xl p-5 cursor-pointer hover:bg-purple-950/50 hover:border-purple-500/40 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-1">My Community</p>
                  <h3 className="text-lg font-bold truncate">{collegeStatus.collegeName}</h3>
                  <p className="text-gray-500 text-sm">{collegeStatus.university}</p>
                </div>
                <span className="text-purple-400 group-hover:translate-x-1 transition text-xl flex-shrink-0 mt-1">→</span>
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {role && <RoleBadge role={role} />}
                {/* Invite code — owner only */}
                {isOwner && collegeStatus.inviteCode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); copyCode(); }}
                    className={`text-[10px] px-2.5 py-1 rounded-full border font-mono transition ${copied ? "bg-green-600/20 border-green-500/40 text-green-300" : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"}`}
                  >
                    {copied ? "✓ Copied!" : `📋 ${collegeStatus.inviteCode}`}
                  </button>
                )}
              </div>
            </div>

            {/* ── Admin Panel button — OWNER ya PRINCIPAL ko dikhega ──────── */}
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-600/15 to-orange-600/15 border border-yellow-500/30 hover:border-yellow-500/50 hover:from-yellow-600/25 hover:to-orange-600/25 transition text-yellow-300 font-bold text-sm flex items-center justify-center gap-2 group"
              >
                <span className="text-lg">⚙️</span>
                Admin Panel
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ml-1 ${
                  isOwner ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"
                }`}>
                  {isOwner ? "Owner" : "Principal"}
                </span>
                <span className="ml-auto text-yellow-600 group-hover:translate-x-1 transition">→</span>
              </button>
            )}

          </div>
        ) : (
          /* ── Not joined — Create / Join ────────────────────────────────── */
          <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">🏫</div>
              <h3 className="font-bold text-lg">Join Your College Community</h3>
              <p className="text-gray-500 text-sm mt-1">Connect with classmates, share resources, and collaborate.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowJoin(true)}
                className="py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition flex items-center justify-center gap-1.5">
                🔗 Join Community
              </button>
              <button onClick={() => setShowCreate(true)}
                className="py-3.5 rounded-2xl border border-white/10 hover:bg-white/5 hover:border-white/20 text-gray-300 hover:text-white font-bold text-sm transition flex items-center justify-center gap-1.5">
                ✨ Create Community
              </button>
            </div>
            <p className="text-center text-gray-600 text-xs mt-3">Have a code? Join. Starting fresh? Create one.</p>
          </div>
        )}

      </div>

      {enlargeAvatar && (
        <ImageModal src={user.avatar} name={user.fullName || user.username} onClose={() => setEnlargeAvatar(false)} />
      )}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-3">
      <p className="text-gray-500 text-[10px] uppercase font-semibold tracking-wide mb-1">{label}</p>
      <p className="text-sm text-white truncate">{value}</p>
    </div>
  );
}