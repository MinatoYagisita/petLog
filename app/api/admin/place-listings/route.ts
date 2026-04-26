import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "minato.yagishita@gmail.com";

export const dynamic = "force-dynamic";

async function verifyAdmin(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("no auth");
  const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  if (decoded.email !== ADMIN_EMAIL) throw new Error("forbidden");
  return decoded;
}

export async function GET(req: NextRequest) {
  try {
    await verifyAdmin(req);
  } catch {
    return Response.json({ error: "権限がありません" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";

  const listings = await prisma.placeListing.findMany({
    where: status === "all" ? {} : { status },
    orderBy: { createdAt: "desc" },
    include: { account: { select: { email: true, accountType: true } } },
  });

  return Response.json(listings);
}
