import { NextRequest } from "next/server";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";
import { randomUUID } from "crypto";
import { JWT } from "google-auth-library";

async function getServiceAccountToken(): Promise<string> {
  const client = new JWT({
    email: process.env.FIREBASE_CLIENT_EMAIL,
    key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) throw new Error("Failed to get access token");
  return tokenResponse.token;
}

export async function POST(req: NextRequest) {
  try {
    await verifyAuth(req);
  } catch (e) {
    console.error("[upload-photo] auth error:", e);
    return unauthorized();
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const path = formData.get("path") as string | null;

    if (!file || !path) {
      return Response.json({ error: "file と path は必須です" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);
    const downloadToken = randomUUID();
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;
    const accessToken = await getServiceAccountToken();

    const boundary = `fb_${randomUUID().replace(/-/g, "")}`;
    const metadata = JSON.stringify({
      name: path,
      contentType: file.type,
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    });

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
      Buffer.from(metadata),
      Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const encodedPath = encodeURIComponent(path);
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodedPath}`;

    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[upload-photo] Firebase Storage error:", res.status, errText);
      return Response.json({ error: `Storage ${res.status}: ${errText}` }, { status: 500 });
    }

    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    return Response.json({ url: downloadUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[upload-photo] storage error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
