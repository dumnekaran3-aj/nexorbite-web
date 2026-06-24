<<<<<<< HEAD
// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Navbar       from "./components/layout/Navbar";
import Footer       from "./components/layout/Footer";

import Home         from "./pages/Home";
import Login        from "./pages/Login";
import Signup       from "./pages/Sigup";
import ProfileSetup from "./pages/ProfileSetup";
import ProfileView  from "./pages/ProfileView";   // logged-in user ka profile
import PublicProfile from "./pages/PublicProfile"; // kisi bhi user ka public profile
import CommunityView from "./pages/CommunityView";
import Privacy      from "./pages/Privacy";
import Terms        from "./pages/Terms";
import Contact      from "./pages/Contact";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"                 element={<Home />} />
          <Route path="/login"            element={<Login />} />
          <Route path="/signup"           element={<Signup />} />
          <Route path="/profile"          element={<ProfileView />} />
          <Route path="/profile-setup"    element={<ProfileSetup />} />

          {/* ── Public profile — kisi bhi user ka ── */}
          <Route path="/profile/:userId"  element={<PublicProfile />} />

          {/* ── Community routes ── */}
          <Route path="/community/:id"    element={<CommunityView />} />
          <Route path="/community"        element={<CommunityView />} />

          <Route path="/privacy"          element={<Privacy />} />
          <Route path="/terms"            element={<Terms />} />
          <Route path="/contact"          element={<Contact />} />
=======
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

>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> aa04f50dce9bd5bf29a92c3bccc9e1271a1b257d
