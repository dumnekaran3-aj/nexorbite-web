// src/hooks/useBackablePanel.js
import { useEffect, useRef } from "react";

export default function useBackablePanel(onClose) {
  const closedViaPopStateRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    closedViaPopStateRef.current = false;

    window.history.pushState({ __panel: true }, "");

    const handlePopState = () => {
      closedViaPopStateRef.current = true;
      onClose();
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("popstate", handlePopState);

      // Real back-press se already close ho chuka -> kuch nahi karna
      if (closedViaPopStateRef.current) return;

      // 🔴 FIX: history.back() ko ek tick defer karo. StrictMode (dev) mein
      // mount -> cleanup -> mount sab synchronously ek hi commit mein chalta
      // hai, isliye agar ye sirf fake-cleanup tha to `mountedRef.current`
      // is setTimeout ke chalne tak wapas `true` ho chuka hoga — tab hum
      // history.back() skip kar dete hain, jo warna async popstate fire
      // karke abhi-abhi remount hue panel ko band kar deta.
      setTimeout(() => {
        if (mountedRef.current) return; // remount ho gaya — genuine unmount nahi tha
        if (window.history.state?.__panel) {
          window.history.back();
        }
      }, 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);
}