export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    const existing = await prisma.hospital.findFirst({ where: { id, userId: uid, deletedAt: null } });
    if (!existing) return Response.json({ error: "見つかりません" }, { status: 404 });

    const body = await req.json() as { name?: string; phone?: string; note?: string };
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
    if (body.note !== undefined) data.note = body.note?.trim() || null;

    const hospital = await prisma.hospital.update({ where: { id }, data });
    return Response.json(hospital);
  } catch {
    return Response.json({ error: "更新できませんでした" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    const existing = await prisma.hospital.findFirst({ where: { id, userId: uid, deletedAt: null } });
    if (!existing) return Response.json({ error: "見つかりません" }, { status: 404 });

    await prisma.hospital.update({ where: { id }, data: { deletedAt: new Date() } });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "削除できませんでした" }, { status: 400 });
  }
}
