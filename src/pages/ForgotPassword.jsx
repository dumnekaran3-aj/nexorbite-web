// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("api/auth/forgot-password", { email });
      // Backend always responds the same way whether or not the account
      // exists (enumeration-safe) — we just move on to the OTP screen
      // either way.
      navigate("/reset-password", {
        state: { email, message: res.data.message || "If that email is registered, a code has been sent." },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Forgot password?</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Enter your account email — we'll send you a code to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-navy-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-500 outline-none"
              placeholder="name@college.edu"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition"
          >
            {loading ? "Sending..." : "Send reset code"}
          </button>

          <p className="text-gray-400 text-sm text-center mt-4">
            <Link to="/login" className="text-brand-500 hover:underline">Back to login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}