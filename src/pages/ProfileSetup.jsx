import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";


export default function ProfileSetup() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    stream: "",
    isPrivate: false
  });
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.fullName || "",
        bio: user.bio || "",
        stream: user.stream || "",
        isPrivate: user.isPrivate || false
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("full_name", formData.full_name);
    data.append("bio", formData.bio);
    data.append("stream", formData.stream);
    data.append("isPrivate", formData.isPrivate);
    if (avatar) data.append("avatar", avatar);

    try {
      // Backend: router.put("/me") call ho raha hai
      const res = await api.put("api/profile/me", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUser(res.data.profile); // Context update kiya
      alert("Profile updated successfully!");
      navigate("/");
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.msg || "Server error"));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white/5 p-6 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-6">Complete Your Profile</h2>
        
        {/* Avatar Upload */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Profile Picture</label>
          <input type="file" onChange={(e) => setAvatar(e.target.files[0])} className="w-full text-sm" />
        </div>

        {/* Form Fields */}
        <input 
          placeholder="Full Name" 
          value={formData.full_name} 
          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          className="w-full bg-black border border-white/10 p-3 rounded-lg mb-3"
        />
        <textarea 
          placeholder="Bio" 
          value={formData.bio} 
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          className="w-full bg-black border border-white/10 p-3 rounded-lg mb-3"
        />
        <input 
          placeholder="Stream (e.g. Computer Science)" 
          value={formData.stream} 
          onChange={(e) => setFormData({...formData, stream: e.target.value})}
          className="w-full bg-black border border-white/10 p-3 rounded-lg mb-3"
        />
        
        <div className="flex items-center gap-2 mb-6">
          <input 
            type="checkbox" 
            checked={formData.isPrivate} 
            onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})}
          />
          <label>Private Account</label>
        </div>

        <button type="submit" className="w-full bg-purple-600 py-3 rounded-lg font-bold">Save Profile</button>
      </form>
    </div>
  );
}