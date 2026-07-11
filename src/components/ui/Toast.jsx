// src/components/ui/Toast.jsx
// Same visual pattern as the local Toast in ProfileView.jsx — extracted so
// every digital-product page doesn't have to redefine it.

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-5 right-5 z-[300] px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl border ${
        toast.type === "error"
          ? "bg-red-950 border-red-500/40 text-red-300"
          : toast.type === "warning"
          ? "bg-yellow-950 border-yellow-500/40 text-yellow-300"
          : "bg-green-950 border-green-500/40 text-green-300"
      }`}
    >
      {toast.msg}
    </div>
  );
}

// Hook: const { toast, showToast } = useToast();
import { useState } from "react";
export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };
  return { toast, showToast };
}