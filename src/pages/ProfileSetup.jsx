// src/pages/ProfileSetup.jsx
//
// FIX: naya "Skills" section add hua — backend me jo vibe-matching fields
// (skills) bana chuke hain (Discover feature), unko yahin se set karte hain.
// Alag PUT /api/profile/skills call hai (taxonomy-validated), basic profile
// save se independent — dono submit pe ek saath chalte hain.
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import { SKILL_TAXONOMY, MAX_SKILLS_PER_USER } from "../constants/skillTaxonomy";

export default function ProfileSetup() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    bio: "",
    stream: "",
    isPrivate: false
  });

  const [avatar, setAvatar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🆕 Skills state — fixed taxonomy se multi-select
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillsLoaded, setSkillsLoaded] = useState(false);

  const streams = [
    { label: "Computer Science", value: "Computer Science" },
    { label: "Mechanical", value: "Mechanical" },
    { label: "Electrical", value: "Electrical" },
    { label: "Designing", value: "Designing" },
    { label: "Civil", value: "Civil" },
    { label: "Common (Arts & Commerce)", value: "Common (Arts & Commerce)" }
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        full_name: user.fullName || "",
        bio: user.bio || "",
        stream: user.stream || "",
        isPrivate: user.isPrivate || false
      });
      if (user.avatar) setPreviewUrl(user.avatar);
    }
  }, [user]);

  // 🆕 Current skills fetch karo — AuthContext ke user object me shayad
  // skills na ho, isliye seedha /api/profile/me se lete hain (Discover
  // Step 2 se yeh field already return karta hai).
  useEffect(() => {
    api.get("/api/profile/me")
      .then((res) => setSelectedSkills(res.data?.profile?.skills || []))
      .catch(() => {})
      .finally(() => setSkillsLoaded(true));
  }, []);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) return prev.filter((s) => s !== skill);
      if (prev.length >= MAX_SKILLS_PER_USER) return prev; // silently cap
      return [...prev, skill];
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = new FormData();
    data.append("username", formData.username);
    data.append("full_name", formData.full_name);
    data.append("bio", formData.bio);
    data.append("stream", formData.stream);
    data.append("isPrivate", formData.isPrivate);
    if (avatar) data.append("avatar", avatar);

    try {
      const res = await api.put("api/profile/me", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // 🆕 Skills alag endpoint se save (taxonomy-validated)
      await api.put("/api/profile/skills", { skills: selectedSkills });

      setUser({ ...res.data.profile, skills: selectedSkills });
      alert("Profile updated successfully!");
      navigate("/");
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.msg || "Server error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white flex items-center justify-center p-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-gray-900 p-8 rounded-3xl border border-white/10 shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-center text-brand-400">Complete Profile</h2>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-brand-500 mb-4 bg-gray-800 flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500 text-sm">Upload Photo</span>
            )}
          </div>
          <input type="file" onChange={handleImageChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer" />
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase">Username</label>
            <input placeholder="@yourhandle" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-navy-900 border border-white/20 p-3 rounded-xl mt-1 focus:border-brand-500 outline-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase">Full Name</label>
            <input placeholder="Aryan..." value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full bg-navy-900 border border-white/20 p-3 rounded-xl mt-1 focus:border-brand-500 outline-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase">Stream / Branch</label>
            <select
              value={formData.stream}
              onChange={(e) => setFormData({...formData, stream: e.target.value})}
              className="w-full bg-navy-900 border border-white/20 p-3 rounded-xl mt-1 focus:border-brand-500 outline-none appearance-none"
            >
              <option value="">Select your stream</option>
              {streams.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase">Bio</label>
            <textarea placeholder="Tell us about yourself..." value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full bg-navy-900 border border-white/20 p-3 rounded-xl mt-1 h-24 focus:border-brand-500 outline-none" />
          </div>

          {/* 🆕 Skills picker — Discover feature ke liye (same-vibe matching) */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400 uppercase">Skills & Interests</label>
              <span className="text-[10px] text-gray-500">{selectedSkills.length}/{MAX_SKILLS_PER_USER}</span>
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5 mb-2">Helps Discover match you with same-vibe people.</p>

            {!skillsLoaded ? (
              <p className="text-xs text-gray-600">Loading...</p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-3 bg-navy-900 border border-white/10 rounded-xl p-3">
                {Object.entries(SKILL_TAXONOMY).map(([category, skills]) => (
                  <div key={category}>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5">{category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill) => {
                        const active = selectedSkills.includes(skill);
                        return (
                          <button
                            type="button"
                            key={skill}
                            onClick={() => toggleSkill(skill)}
                            className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                              active
                                ? "bg-brand-600 text-white border-brand-500"
                                : "bg-white/5 text-gray-400 border-white/10 hover:border-brand-500/40"
                            }`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 py-2">
            <input type="checkbox" checked={formData.isPrivate} onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})} className="w-5 h-5 accent-brand-600" />
            <label className="text-sm">Make my account private</label>
          </div>
        </div>

        <button disabled={isSubmitting} type="submit" className="w-full mt-6 bg-brand-600 hover:bg-brand-700 py-4 rounded-xl font-bold transition-all disabled:opacity-50">
          {isSubmitting ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}