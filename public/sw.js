// public/sw.js — Service Worker
// Yeh file /public folder mein jaayegi (Vite automatically serve karta hai)
// IMPORTANT: /public/sw.js → browser mein /sw.js pe accessible hoga

const CACHE_NAME = "nexorbite-v1";

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

// ── Push event — background mein notification show karo ──────────────────────
self.addEventListener("push", (e) => {
  if (!e.data) return;

  let data;
  try {
    data = e.data.json();
  } catch {
    data = { title: "NexOrbite", body: e.data.text(), url: "/" };
  }

  const { title, body, icon, badge, url, tag } = data;

  const options = {
    body:    body    || "Get Something New!",
    icon:    icon    || "/icons/icon-192x192.png",
    badge:   badge   || "/icons/badge-72x72.png",
    tag:     tag     || "nexorbite",
    data:    { url:  url || "/" },
    vibrate: [100, 50, 100],
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
    renotify:    true,
    requireInteraction: false,
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

// ── Message from app (navigate after focus) ───────────────────────────────────
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});