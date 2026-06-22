import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Sigup";
import { AuthProvider } from "./context/AuthContext";
import ProfileSetup from "./pages/ProfileSetup";
import ProfileView from "./pages/ProfileView";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";


export default function App() {
  return (
    <AuthProvider> {/* Yahan wrap kiya */}
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Naya route yahan add hoga ProfileSetup ke liye */}

<Route path="/profile" element={<ProfileView />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />

        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}
