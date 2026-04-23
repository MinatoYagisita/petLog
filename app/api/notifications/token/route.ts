export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const { token } = await req.json() as { token: string };
    if (!token) return Response.json({ error: "token は必須です" }, { status: 400 });

    await prisma.fcmToken.upsert({
      where: { token },
      update: { userId: uid, updatedAt: new Date() },
      create: { userId: uid, token },
    });

    return Response.json({ ok: true });
  } catch {
    return unauthorized();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const { token } = await req.json() as { token: string };
    if (!token) return Response.json({ error: "token は必須です" }, { status: 400 });

    await prisma.fcmToken.deleteMany({ where: { token, userId: uid } });
    return new Response(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
