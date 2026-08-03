// src/hooks/useKeyboardSafeHeight.js
//
// PROBLEM (keyboard bug): the chat panels use `height: 100dvh` / `fixed
// inset-0` to fill the screen. On many Android browsers/WebViews, opening
// the on-screen keyboard does NOT shrink `100dvh` or the layout viewport —
// the page keeps its full "no keyboard" height, and the keyboard just
// covers the bottom part of it instead. Because the panel is `flex flex-col`
// with the header pinned at the top and the input pinned at the bottom via
// `flex-shrink-0`, the whole column gets pushed upward behind the keyboard,
// which is exactly the "user profile / 3-dots part hide horaha hai" bug.
//
// FIX: track the ACTUAL visible height using `window.visualViewport`
// (supported on all modern mobile browsers) and apply it as an explicit
// inline height on the panel's outer container. When the keyboard opens,
// `visualViewport.height` shrinks immediately and accurately, so the panel
// (header + messages + input) resizes to fit exactly what's visible —
// header and input stay on-screen, only the message list shrinks.
//
// Usage:
//   const heightPx = useKeyboardSafeHeight();
//   <div style={{ height: heightPx }} className="fixed inset-0 ...">
//
// Falls back to `undefined` (letting CSS `100dvh` handle it) on browsers
// without `visualViewport` support — never makes things worse, only better.

import { useEffect, useState } from "react";

export default function useKeyboardSafeHeight() {
  const [height, setHeight] = useState(
    () => window.visualViewport?.height ?? window.innerHeight
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined; // no support — CSS 100dvh fallback stays in charge

    const update = () => setHeight(vv.height);
    update();

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return height;
}