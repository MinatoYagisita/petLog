import type { Auth } from "firebase-admin/auth";
import type { Messaging } from "firebase-admin/messaging";
import type { Storage } from "firebase-admin/storage";

let _auth: Auth | null = null;
let _messaging: Messaging | null = null;
let _storage: Storage | null = null;

function initAdminApp() {
  const { initializeApp, getApps, cert } = require("firebase-admin/app");
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
}

function getAdminAuth(): Auth {
  if (_auth) return _auth;
  initAdminApp();
  const { getAuth } = require("firebase-admin/auth");
  _auth = getAuth();
  return _auth!;
}

function getAdminMessaging(): Messaging {
  if (_messaging) return _messaging;
  initAdminApp();
  const { getMessaging } = require("firebase-admin/messaging");
  _messaging = getMessaging();
  return _messaging!;
}

function getAdminStorage(): Storage {
  if (_storage) return _storage;
  initAdminApp();
  const { getStorage } = require("firebase-admin/storage");
  _storage = getStorage();
  return _storage!;
}

export const adminAuth = {
  verifyIdToken: (token: string) => getAdminAuth().verifyIdToken(token),
};

export const adminMessaging = {
  sendEachForMulticast: (
    msg: Parameters<Messaging["sendEachForMulticast"]>[0]
  ) => getAdminMessaging().sendEachForMulticast(msg),
};

export const adminStorage = {
  bucket: () => getAdminStorage().bucket(),
};
