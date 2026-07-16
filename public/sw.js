// public/sw.js — Service Worker
// Yeh file /public folder mein jaayegi (Vite automatically serve karta hai)
// IMPORTANT: /public/sw.js → browser mein /sw.js pe accessible hoga

const CACHE_NAME = "nexorbite-v2";

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

// ── Push event — background/foreground dono mein OS notification show karo ───
// WhatsApp/Telegram pattern follow karte hain:
//   - "icon"  (large icon)   → sender ka avatar agar hai, warna app logo
//   - "badge" (status bar)   → HAMESHA app ka apna monochrome mark
//     (Android is icon ko tint karke status bar mein dikhata hai — isse
//     user ko turant pata chalta hai "ye NexOrbite ka notification hai",
//     exactly jaise WhatsApp ka chhota icon clock ke paas dikhta hai)
self.addEventListener("push", (e) => {
  if (!e.data) return;

  let data;
  try {
    data = e.data.json();
  } catch {
    data = { title: "NexOrbite", body: e.data.text(), url: "/" };
  }

  const { title, body, icon, image, url, tag } = data;

  const options = {
    body:    body  || "Get Something New!",
    icon:    icon  || "/icons/icon-192x192.png",
    badge:   "/icons/badge-72x72.png",   // app mark hamesha fixed — server override ignore
    image:   image || undefined,          // optional bada banner (e.g. shared post/photo)
    tag:     tag   || "nexorbite",
    data:    { url: url || "/" },
    vibrate: [100, 50, 100],
    actions: [
      { action: "open",    title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
    renotify:           true,   // same tag ho tab bhi phir se alert/vibrate kare
    requireInteraction: false,  // WhatsApp jaisa — apne aap dismiss ho sakta hai
    silent:             false,
  };

  e.waitUntil(
    self.registration.showNotification(title || "NexOrbite", options)
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();

  if (e.action === "dismiss") return;

  const targetUrl = e.notification.data?.url || "/";
  const fullUrl   = new URL(targetUrl, self.location.origin).href;

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Agar app already open hai — focus karo aur navigate karo
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.focus();
          client.postMessage({ type: "NAVIGATE", url: targetUrl });
          return;
        }
      }
      // Naya tab open karo
      if (clients.openWindow) return clients.openWindow(fullUrl);
    })
  );
});

// ── Message from app (navigate after focus / force-update SW) ─────────────────
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});