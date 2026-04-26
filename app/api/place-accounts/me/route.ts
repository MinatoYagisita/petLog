import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "認証が必要です" }, { status: 401 });
  }

  let decoded: { uid: string; email?: string };
  try {
    decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  } catch {
    return Response.json({ error: "認証が必要です" }, { status: 401 });
  }

  const account = await prisma.placeAccount.findUnique({ where: { id: decoded.uid } });
  if (!account) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(account);
}
