// src/pages/digitalProduct/SellProductPage.jsx
import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { createDigitalProduct } from "../../lib/digitalproduct.api";
import Toast, { useToast } from "../../components/ui/Toast";
import {
  BRANCHES,
  BRANCH_ASSET_SLOTS,
  BRANCH_CATEGORIES,
  BRANCH_COLORS,
} from "../../constants/digitalProduct.constants";


// ── Shared field styling (same pattern as ProfileView's CreateCommunityModal) ─
const iCls = (err) =>
  `w-full bg-white/5 border ${err ? "border-red-500/50" : "border-white/8"} rounded-2xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-purple-500 transition`;

function Field({ label, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

const fileLabel = (f) => (f ? `✓ ${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)` : null);

export default function SellProductPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [step, setStep] = useState(1); // 1: branch, 2: details, 3: files, 4: review
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    branch: "",
    category: "",
    title: "",
    description: "",
    price: "",
    pushTo: "community",
  });
  const [attributes, setAttributes] = useState([]); // [{label, value}]
  const [cover, setCover] = useState(null);
  const [assetFiles, setAssetFiles] = useState({}); // { slotName: File }

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const slots = useMemo(() => BRANCH_ASSET_SLOTS[form.branch] || [], [form.branch]);
  const categories = useMemo(() => BRANCH_CATEGORIES[form.branch] || [], [form.branch]);

  // ── Step validation ─────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!form.branch) e.branch = "Select a branch";
    if (!form.category) e.category = "Select a category";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title required";
    if (!form.description.trim()) e.description = "Description required";
    if (form.price === "" || Number(form.price) < 0) e.price = "Enter a valid price (0 for free)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!cover) e.cover = "Cover image required";
    for (const s of slots) {
      if (s.required && !assetFiles[s.slot]) e[s.slot] = `${s.label} is required`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextFrom = (n) => {
    if (n === 1 && !validateStep1()) return;
    if (n === 2 && !validateStep2()) return;
    if (n === 3 && !validateStep3()) return; // ✅ FIX: files ab yahan bhi check hote hain
    setStep(n + 1);
  };

  // ── Attributes (optional key-value spec pairs) ─────────────────────────
  const addAttribute = () => setAttributes((p) => [...p, { label: "", value: "" }]);
  const updateAttribute = (i, key, val) =>
    setAttributes((p) => p.map((a, idx) => (idx === i ? { ...a, [key]: val } : a)));
  const removeAttribute = (i) => setAttributes((p) => p.filter((_, idx) => idx !== i));

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep3()) {
      setStep(3); // ✅ FIX: errors ab visible honge, silently return nahi hoga
      showToast("Please complete all required file uploads before publishing", "error");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("branch", form.branch);
      fd.append("category", form.category);
      fd.append("price", form.price);
      fd.append("pushTo", form.pushTo);
      fd.append(
        "attributes",
        JSON.stringify(attributes.filter((a) => a.label.trim() && a.value.trim()))
      );
      fd.append("cover", cover);
      slots.forEach((s) => {
        if (assetFiles[s.slot]) fd.append(s.slot, assetFiles[s.slot]);
      });

      const result = await createDigitalProduct(fd);
      showToast("Product listed successfully! 🎉", "success");
      setTimeout(() => navigate(`/marketplace/${result.product._id}`), 1000);
    } catch (err) {
      showToast(err?.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_LABELS = ["Branch", "Details", "Files", "Review"];

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-16">
      <Toast toast={toast} />

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">💰 Sell Your Project</h1>
          <p className="text-gray-500 text-sm mt-1">List your project as a digital bundle for others to buy.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${i + 1 <= step ? "bg-purple-600" : "bg-white/8"}`} />
              <p className={`text-[10px] mt-1 font-semibold ${i + 1 === step ? "text-purple-400" : "text-gray-600"}`}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 space-y-5">
          {/* ── STEP 1: Branch + Category ────────────────────────────────── */}
          {step === 1 && (
            <>
              <Field label="Branch *" error={errors.branch}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {BRANCHES.map((b) => {
                    const c = BRANCH_COLORS[b];
                    const active = form.branch === b;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          set("branch", b);
                          set("category", "");
                        }}
                        className="rounded-2xl border px-3 py-2.5 text-sm font-semibold transition text-left"
                        style={{
                          background: active ? c.pill : "rgba(255,255,255,0.03)",
                          borderColor: active ? c.border : "rgba(255,255,255,0.08)",
                          color: active ? c.dot : "#9ca3af",
                        }}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {form.branch && (
                <Field label="Category *" error={errors.category}>
                  <select value={form.category} onChange={(e) => set("category", e.target.value)} className={iCls(errors.category)}>
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              )}
            </>
          )}

          {/* ── STEP 2: Details ──────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <Field label="Title *" error={errors.title}>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Autonomous Drone — Full CAD + Code Bundle" className={iCls(errors.title)} />
              </Field>

              <Field label="Description *" error={errors.description}>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What's included, how it works, who it's for..." rows={5} className={iCls(errors.description) + " resize-none"} />
              </Field>

              <Field label="Price (₹) *" error={errors.price} hint="Set 0 to list it for free">
                <input type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0" className={iCls(errors.price)} />
              </Field>

              <Field label="Attributes" hint="Optional specs shown on the product page (e.g. 'Pages: 40', 'Language: Python')">
                <div className="space-y-2">
                  {attributes.map((a, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={a.label} onChange={(e) => updateAttribute(i, "label", e.target.value)} placeholder="Label" className={iCls()} />
                      <input value={a.value} onChange={(e) => updateAttribute(i, "value", e.target.value)} placeholder="Value" className={iCls()} />
                      <button type="button" onClick={() => removeAttribute(i)} className="px-3 rounded-2xl border border-white/8 text-gray-500 hover:text-red-400 hover:border-red-500/40 transition">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={addAttribute} className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition">+ Add attribute</button>
                </div>
              </Field>

              <Field label="Push to community" hint="Share this listing in your college community feed too">
                <select value={form.pushTo} onChange={(e) => set("pushTo", e.target.value)} className={iCls()}>
                  <option value="community">Community feed only</option>
                  <option value="both">Community + Marketplace</option>
                  <option value="none">Marketplace only (don't push)</option>
                </select>
              </Field>
            </>
          )}

          {/* ── STEP 3: Files ─────────────────────────────────────────────── */}
          {step === 3 && (
            <>
              <Field label="Cover Image *" error={errors.cover} hint="Public thumbnail shown on product cards">
                <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files[0])}
                  className="text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/40 cursor-pointer" />
                {cover && <p className="text-xs text-green-400 mt-1">{fileLabel(cover)}</p>}
              </Field>

              <div className="h-px bg-white/8" />

              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                {form.branch} Bundle Assets
              </p>

              {slots.map((s) => (
                <Field key={s.slot} label={`${s.emoji} ${s.label} ${s.required ? "*" : "(optional)"}`} error={errors[s.slot]}>
                  <input
                    type="file"
                    accept={s.accept}
                    onChange={(e) => setAssetFiles((p) => ({ ...p, [s.slot]: e.target.files[0] }))}
                    className="text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/40 cursor-pointer"
                  />
                  {assetFiles[s.slot] && <p className="text-xs text-green-400 mt-1">{fileLabel(assetFiles[s.slot])}</p>}
                </Field>
              ))}
            </>
          )}

          {/* ── STEP 4: Review ────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: BRANCH_COLORS[form.branch]?.pill, color: BRANCH_COLORS[form.branch]?.dot }}>
                  {form.branch}
                </span>
                <span className="text-xs text-gray-500">{form.category}</span>
              </div>
              <h3 className="text-lg font-bold">{form.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{form.description}</p>
              <p className="text-2xl font-bold text-purple-400">{Number(form.price) === 0 ? "Free" : `₹${form.price}`}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 rounded-xl px-3 py-2">
                  <p className="text-gray-500">Cover</p>
                  <p className="text-green-400 truncate">{cover?.name || "—"}</p>
                </div>
                {slots.filter((s) => assetFiles[s.slot]).map((s) => (
                  <div key={s.slot} className="bg-white/5 rounded-xl px-3 py-2">
                    <p className="text-gray-500">{s.label}</p>
                    <p className="text-green-400 truncate">{assetFiles[s.slot].name}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-600">
                By listing, you confirm you own the rights to these files. EuHub takes a 10% commission on paid sales.
              </p>
            </div>
          )}

          {/* ── Nav buttons ───────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => (step === 1 ? navigate(-1) : setStep(step - 1))}
              className="flex-1 py-3 rounded-2xl border border-white/10 text-gray-400 hover:text-white text-sm font-semibold transition"
            >
              {step === 1 ? "Cancel" : "← Back"}
            </button>
            <button
              onClick={() => (step < 4 ? nextFrom(step) : handleSubmit())}
              disabled={submitting}
              className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Publishing...</>
              ) : step < 4 ? "Next →" : "Publish Listing 🚀"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}