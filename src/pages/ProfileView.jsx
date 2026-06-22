// src/pages/ProfileView.jsx
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function ProfileView() {
  const { user } = useContext(AuthContext);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <div className="max-w-2xl mx-auto bg-white/5 p-8 rounded-3xl border border-white/10">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <img 
            src={user.avatar || "https://ui-avatars.com/api/?name=" + user.fullName} 
            alt="Profile" 
            className="w-32 h-32 rounded-full border-4 border-purple-500 mb-4 object-cover"
          />
          <h2 className="text-3xl font-bold">{user.fullName}</h2>
          <p className="text-gray-400">@{user.username}</p>
        </div>

        {/* Details Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/40 p-4 rounded-xl">
            <label className="text-gray-500 text-xs uppercase">Email</label>
            <p>{user.email}</p>
          </div>
          <div className="bg-black/40 p-4 rounded-xl">
            <label className="text-gray-500 text-xs uppercase">Stream</label>
            <p>{user.stream || "Not provided"}</p>
          </div>
          <div className="col-span-full bg-black/40 p-4 rounded-xl">
            <label className="text-gray-500 text-xs uppercase">Bio</label>
            <p className="mt-1">{user.bio || "No bio added yet."}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex gap-4">
          <Link to="/profile-setup" className="flex-1 text-center bg-purple-600 py-3 rounded-lg font-bold">
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}