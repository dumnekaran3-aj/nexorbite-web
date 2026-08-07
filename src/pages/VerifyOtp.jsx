// src/pages/VerifyOtp.jsx
import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import OtpInput from "../components/auth/OtpInput";

const RESEND_COOLDOWN_SEC = 30;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useContext(AuthContext);

  // email is passed via navigate("/verify-otp", { state: { email } })
  // from Signup.jsx / Login.jsx. If someone lands here directly (refresh,
  // bookmark), there's no email in state — ask for it instead of guessing.
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(location.state?.message || "");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const submitOtp = async (fullOtp) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("api/auth/verify-email", { email, otp: fullOtp });

      // Backend's verify-email already returns a token + user on success —
      // no separate /signin call needed, same pattern the old signup flow
      // used before email-verification existed.
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        navigate("/profile-setup");
      } else {
        // e.g. "Email already verified" response has no token — send them
        // to login instead.
        setInfo(res.data.message || "Verified — please log in.");
        setTimeout(() => navigate("/login"), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code. Please try again.");
      setOtp(""); // clear boxes so the user can retype cleanly
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setError("");
    try {
      const res = await api.post("api/auth/resend-otp", { email });
      setInfo(res.data.message || "A new code has been sent.");
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend code. Try again shortly.");
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (otp.length === 6) submitOtp(otp);
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Verify your email</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Enter the 6-digit code we sent to<br />
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

        <form onSubmit={handleManualSubmit} className="space-y-6">
          <OtpInput
            length={6}
            value={otp}
            onChange={setOtp}
            onComplete={submitOtp} // auto-submits the moment all 6 digits are filled
            disabled={loading}
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {!error && info && <p className="text-brand-400 text-sm text-center">{info}</p>}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

          <p className="text-gray-400 text-sm text-center">
            Didn't get a code?{" "}
            {cooldown > 0 ? (
              <span className="text-gray-500">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-brand-500 hover:underline"
              >
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