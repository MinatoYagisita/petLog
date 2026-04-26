import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

dotenv.config({ path: ".env.local" });

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const bucket = getStorage().bucket();

await bucket.setMetadata({
  cors: [
    {
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://petlog-8d6bd.web.app",
        "https://petlog-8d6bd.firebaseapp.com",
      ],
      method: ["GET", "HEAD", "PUT", "POST", "DELETE"],
      responseHeader: ["Content-Type", "Authorization", "x-firebase-token"],
      maxAgeSeconds: 3600,
    },
  ],
});

console.log("✅ CORS configured successfully on bucket:", bucket.name);
