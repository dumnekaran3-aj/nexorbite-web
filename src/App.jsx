// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Sigup";
import ProfileSetup from "./pages/ProfileSetup";
import ProfileView from "./pages/ProfileView";
import PublicProfile from "./pages/publicProfile"; // Important: Dono versions se merge karein
import CommunityView from "./pages/CommunityView";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/profile/:userId" element={<PublicProfile />} />
          <Route path="/community/:id" element={<CommunityView />} />
          <Route path="/community" element={<CommunityView />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}