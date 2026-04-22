import type { Auth } from "firebase-admin/auth";

let _auth: Auth | null = null;

function getAdminAuth(): Auth {
  if (_auth) return _auth;

  const { initializeApp, getApps, cert } = require("firebase-admin/app");
  const { getAuth } = require("firebase-admin/auth");

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }

  _auth = getAuth();
  return _auth!;
}

export const adminAuth = {
  verifyIdToken: (token: string) => getAdminAuth().verifyIdToken(token),
};
