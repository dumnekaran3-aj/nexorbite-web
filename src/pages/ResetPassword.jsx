// src/pages/ResetPassword.jsx
import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import OtpInput from "../components/auth/OtpInput"; // reused from Part 4 — same component, no duplicate

const RESEND_COOLDOWN_SEC = 30;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useContext(AuthContext);

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(location.state?.message || "");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the 6-digit code first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("api/auth/reset-password", { email, otp, newPassword });

      // Same pattern as verify-email (Part 4): backend logs the user in
      // directly on success — no separate /signin call needed.
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code. Please try again.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setError("");
    try {
      // forgot-password doubles as its own resend — no separate endpoint.
      const res = await api.post("api/auth/forgot-password", { email });
      setInfo(res.data.message || "A new code has been sent.");
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend code. Try again shortly.");
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Reset password</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Enter the code sent to<br />
          <span className="text-white">{email || "your email"}</span>
        </p>

        {!location.state?.email && (
          <div className="mb-4">
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
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <OtpInput length={6} value={otp} onChange={setOtp} disabled={loading} />

          <div>
            <label className="block text-gray-400 text-sm mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-navy-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-500 outline-none"
              placeholder="At least 8 characters, with a number"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {!error && info && <p className="text-brand-400 text-sm text-center">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>

          <p className="text-gray-400 text-sm text-center">
            Didn't get a code?{" "}
            {cooldown > 0 ? (
              <span className="text-gray-500">Resend in {cooldown}s</span>
            ) : (
              <button type="button" onClick={handleResend} className="text-brand-500 hover:underline">
                Resend code
              </button>
            )}
          </p>

          <p className="text-gray-400 text-sm text-center">
            <Link to="/login" className="text-brand-500 hover:underline">Back to login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}