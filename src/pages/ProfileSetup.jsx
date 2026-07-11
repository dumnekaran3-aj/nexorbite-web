import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function ProfileSetup() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    bio: "",
    stream: "", // Yahan selected value store hogi
    isPrivate: false
  });
  
  const [avatar, setAvatar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Streams ki list
  const streams = [
    { label: "Computer Science", value: "cs" },
    { label: "Mechanical", value: "mechanical" },
    { label: "Electrical", value: "electrical" },
    { label: "Designing", value: "desineing" },
    { label: "Civil", value: "civil" },
    { label: "Common (Arts & Commerce)", value: "commen" }
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
      setUser(res.data.profile);
      alert("Profile updated successfully!");
      navigate("/");
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.msg || "Server error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-gray-900 p-8 rounded-3xl border border-white/10 shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Complete Profile</h2>
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-purple-500 mb-4 bg-gray-800 flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500 text-sm">Upload Photo</span>
            )}
          </div>
          <input type="file" onChange={handleImageChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer" />
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase">Username</label>
            <input placeholder="@yourhandle" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded-xl mt-1 focus:border-purple-500 outline-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase">Full Name</label>
            <input placeholder="Aryan..." value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded-xl mt-1 focus:border-purple-500 outline-none" />
          </div>

          {/* Updated Stream Dropdown */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase">Stream / Branch</label>
            <select 
              value={formData.stream} 
              onChange={(e) => setFormData({...formData, stream: e.target.value})} 
              className="w-full bg-black border border-white/20 p-3 rounded-xl mt-1 focus:border-purple-500 outline-none appearance-none"
            >
              <option value="">Select your stream</option>
              {streams.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase">Bio</label>
            <textarea placeholder="Tell us about yourself..." value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded-xl mt-1 h-24 focus:border-purple-500 outline-none" />
          </div>
          
          <div className="flex items-center gap-3 py-2">
            <input type="checkbox" checked={formData.isPrivate} onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})} className="w-5 h-5 accent-purple-600" />
            <label className="text-sm">Make my account private</label>
          </div>
        </div>

        <button disabled={isSubmitting} type="submit" className="w-full mt-6 bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold transition-all disabled:opacity-50">
          {isSubmitting ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}