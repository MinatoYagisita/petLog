import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from "./firebase";

export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

  if (Notification.permission === "denied") return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const messaging = getMessaging(app);

  return getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
}

export function setupForegroundHandler(): () => void {
  if (typeof window === "undefined") return () => {};
  const messaging = getMessaging(app);
  return onMessage(messaging, (payload) => {
    const { title, body } = payload.notification ?? {};
    if (title && Notification.permission === "granted") {
      new Notification(title, { body: body ?? "" });
    }
  });
}
