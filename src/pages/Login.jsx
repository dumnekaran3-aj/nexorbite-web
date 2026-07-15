import { useState, useContext } from "react"; // useContext add kiya
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // Import AuthContext
import api from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  
  // AuthContext se setUser access kiya
  const { setUser } = useContext(AuthContext); 

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('api/auth/signin', { email, password });
      console.log("Full Response:", res.data);

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        
        // Context ko update karein taaki poori app ko user mil jaye
        setUser(res.data.user); 
        
        // Redirect logic
        navigate("/");
      } else {
        alert("Backend se token nahi mila!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Sign In</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
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
          <div>
            <label className="block text-gray-400 text-sm mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-navy-900 border border-white/10 rounded-lg p-3 text-white focus:border-brand-500 outline-none"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg transition mt-4"
          >
            Login
          </button>

          <p className="text-gray-400 text-sm text-center mt-4">
            Don't have an account? <Link to="/signup" className="text-brand-500 hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}


//mechanical ,electrical ,  civil , commen , cs