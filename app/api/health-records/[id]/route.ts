export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    const existing = await prisma.healthRecord.findFirst({
      where: { id, deletedAt: null, pet: { userId: uid } },
    });
    if (!existing) return Response.json({ error: "見つかりません" }, { status: 404 });

    const body = await req.json();
    const record = await prisma.healthRecord.update({
      where: { id },
      data: { ...body, isBackfilled: true },
    });
    return Response.json(record);
  } catch {
    return Response.json({ error: "更新できませんでした" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    const existing = await prisma.healthRecord.findFirst({
      where: { id, deletedAt: null, pet: { userId: uid } },
    });
    if (!existing) return Response.json({ error: "見つかりません" }, { status: 404 });

    await prisma.healthRecord.update({ where: { id }, data: { deletedAt: new Date() } });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "削除できませんでした" }, { status: 400 });
  }
}
