// src/components/AboutModal.jsx
//
// "About NexOrbite" modal — shown from the Navbar's "About NexOrbite" link.
// Content mirrors what the platform actually does (multi-community system,
// marketplace, chat, notifications, role management) so it stays true to
// the product instead of generic marketing copy.

import { useEffect } from "react";

// ── Static content, kept outside the component so it isn't re-created on every render ──
const FEATURES = [
  { icon: "🏫", title: "Campus Communities", desc: "Join your college's private community via invite code, plus public communities across campuses." },
  { icon: "🛒", title: "Skill Marketplace",  desc: "Sell CAD files, code, PCB layouts, notes and other digital work to fellow students." },
  { icon: "💬", title: "Real-time Chat",     desc: "1-on-1 and group chat with typing indicators, reactions, and read receipts." },
  { icon: "🔔", title: "Smart Notifications", desc: "Stay updated on messages, requests, and community activity in real time." },
  { icon: "🤝", title: "Collaborate",        desc: "Find skilled students across branches and years for your next project." },
  { icon: "🔐", title: "Role Management",    desc: "Owner, Principal, HOD, Teacher, Student — each with the right level of control." },
];

const STEPS = [
  { step: "01", title: "Create Your Profile", desc: "Sign up and set up your student profile in minutes." },
  { step: "02", title: "Join Your Community",  desc: "Use an invite code to join your college's private space." },
  { step: "03", title: "Build & Earn",         desc: "Chat, collaborate, share projects, and sell your skills." },
];

// ── Small presentational pieces ──────────────────────────────────────────
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="flex gap-3 bg-white/[0.03] border border-white/8 rounded-2xl p-3">
      <span className="text-2xl flex-shrink-0" aria-hidden="true">{icon}</span>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function StepCard({ step, title, desc }) {
  return (
    <div className="flex-1 text-center bg-white/[0.03] border border-white/8 rounded-2xl p-4">
      <p className="text-3xl font-extrabold text-brand-500/30 mb-1">{step}</p>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-gray-500 text-xs mt-1">{desc}</p>
    </div>
  );
}

function ModalHeader({ onClose }) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
      <h2 id="about-modal-title" className="text-xl font-extrabold">
        About <span className="text-white">Nex</span><span className="text-brand-400">Orbite</span>
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
      >
        ✕
      </button>
    </div>
  );
}

function FeaturesSection() {
  return (
    <div className="px-6 py-5 border-b border-white/10">
      <h3 className="text-lg font-bold mb-1">Everything in One Place</h3>
      <p className="text-gray-400 text-sm mb-5">Built for students, by students</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </div>
  );
}

function StepsSection() {
  return (
    <div className="px-6 py-5">
      <h3 className="text-lg font-bold mb-1">How It Works</h3>
      <p className="text-gray-400 text-sm mb-4">3 simple steps to get started</p>
      <div className="flex flex-col sm:flex-row gap-4">
        {STEPS.map((s) => (
          <StepCard key={s.step} {...s} />
        ))}
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────
export default function AboutModal({ onClose }) {
  // Close on Escape + lock background scroll while open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader onClose={onClose} />

        <div className="overflow-y-auto">
          <FeaturesSection />
          <StepsSection />
        </div>

        <div className="px-6 py-5 border-t border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 rounded-2xl text-sm font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}