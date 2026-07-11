// src/lib/pushManager.js
// Push subscription manage karta hai — AuthContext se call hoga login ke baad

import api from "./api";

// VAPID public key ko Uint8Array mein convert karo
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Device type detect karo
function detectDevice() {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "desktop";
}

// ── Main function — login ke baad call karo ───────────────────────────────────
export const setupPushNotifications = async () => {
  // Service Worker support check
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("[PUSH] Not supported in this browser");
    return false;
  }

  try {
    // 1. Service Worker register karo
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("[PUSH] SW registered:", registration.scope);

    // 2. Permission check / request
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[PUSH] Permission denied");
      return false;
    }

    // 3. VAPID public key fetch karo
    const vapidRes = await api.get("/api/notifications/vapid-key");
    const vapidKey = vapidRes.data?.vapidKey;
    if (!vapidKey) throw new Error("VAPID key missing");

    // 4. Existing subscription check
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      // Already subscribed — re-save to backend (might have changed)
      await saveToDB(existingSub);
      return true;
    }

    // 5. New subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    // 6. Backend pe save karo
    await saveToDB(subscription);
    console.log("[PUSH] Subscribed successfully");
    return true;

  } catch (err) {
    console.error("[PUSH] Setup failed:", err.message);
    return false;
  }
};

async function saveToDB(subscription) {
  const sub = subscription.toJSON();
  await api.post("/api/notifications/subscribe", {
    endpoint:  sub.endpoint,
    keys:      sub.keys,
    device:    detectDevice(),
    userAgent: navigator.userAgent,
  });
}

// ── Unsubscribe ───────────────────────────────────────────────────────────────
export const unsubscribePush = async () => {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await api.delete("/api/notifications/unsubscribe", {
        data: { endpoint: sub.endpoint },
      });
      await sub.unsubscribe();
    }
  } catch (err) {
    console.error("[PUSH] Unsubscribe failed:", err.message);
  }
};

// ── Handle SW message (navigate after notification click) ─────────────────────
export const setupSWMessageHandler = (navigate) => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data?.type === "NAVIGATE" && e.data.url) {
      navigate(e.data.url);
    }
  });
};