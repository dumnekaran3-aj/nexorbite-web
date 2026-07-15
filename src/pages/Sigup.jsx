import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function Signup() {
  // Backend model ke fields ke exact naam: username, email, password
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });
  
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Backend route 'api/auth/signup' par exact data bhej rahe hain
      await api.post('api/auth/signup', formData);
      alert("Signup Successful! Please Login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.msg || "Signup Failed");
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Create Account</h2>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Username</label>
            <input 
              type="text" 
              required
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              className="w-full bg-navy-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Email</label>
            <input 
              type="email" 
              required
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              className="w-full bg-navy-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Password</label>
            <input 
              type="password" 
              required
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              className="w-full bg-navy-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-500 outline-none" 
            />
          </div>
          
          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg transition mt-4">
            Sign Up
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-4">
          Already have an account? <Link to="/login" className="text-brand-500 hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}