import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";
import { prisma } from "./prisma";

export type AuthContext = { uid: string };

export async function verifyAuth(req: NextRequest): Promise<AuthContext> {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("認証が必要です");
  }

  const token = authorization.slice(7);
  const decoded = await adminAuth.verifyIdToken(token);

  // Upsert user record on first access
  await prisma.user.upsert({
    where: { id: decoded.uid },
    update: {},
    create: { id: decoded.uid, email: decoded.email },
  });

  return { uid: decoded.uid };
}

export function unauthorized() {
  return Response.json({ error: "認証が必要です" }, { status: 401 });
}
