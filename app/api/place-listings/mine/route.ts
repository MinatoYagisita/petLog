import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "認証が必要です" }, { status: 401 });
  }

  let decoded: { uid: string };
  try {
    decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  } catch {
    return Response.json({ error: "認証が必要です" }, { status: 401 });
  }

  const listings = await prisma.placeListing.findMany({
    where: { accountId: decoded.uid },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(listings);
}
