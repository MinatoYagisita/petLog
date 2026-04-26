import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "minato.yagishita@gmail.com";

async function verifyAdmin(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("no auth");
  const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  if (decoded.email !== ADMIN_EMAIL) throw new Error("forbidden");
  return decoded;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(req);
  } catch {
    return Response.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, adminNote } = body;

  if (!["approved", "rejected"].includes(status)) {
    return Response.json({ error: "status は approved または rejected" }, { status: 400 });
  }

  const listing = await prisma.placeListing.update({
    where: { id },
    data: { status, adminNote: adminNote ?? null },
  });

  return Response.json(listing);
}
