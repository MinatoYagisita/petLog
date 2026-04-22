export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    const trimming = await prisma.trimming.findFirst({
      where: { id, deletedAt: null, pet: { userId: uid } },
    });
    if (!trimming) return Response.json({ error: "見つかりません" }, { status: 404 });
    return Response.json(trimming);
  } catch {
    return Response.json({ error: "見つかりません" }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    const existing = await prisma.trimming.findFirst({
      where: { id, deletedAt: null, pet: { userId: uid } },
    });
    if (!existing) return Response.json({ error: "見つかりません" }, { status: 404 });

    const body = await req.json() as {
      salonId?: string | null;
      salonName?: string | null;
      scheduledDate?: string;
      completedDate?: string | null;
      content?: string | null;
      cost?: number | null;
      note?: string | null;
      nextScheduledDate?: string | null;
    };

    const data: Record<string, unknown> = {};
    if ("salonId" in body) data.salonId = body.salonId ?? null;
    if ("salonName" in body) data.salonName = body.salonName?.trim() ?? null;
    if (body.scheduledDate) data.scheduledDate = new Date(body.scheduledDate);
    if ("completedDate" in body) data.completedDate = body.completedDate ? new Date(body.completedDate) : null;
    if ("content" in body) data.content = body.content?.trim() ?? null;
    if ("cost" in body) data.cost = body.cost ?? null;
    if ("note" in body) data.note = body.note?.trim() ?? null;
    if ("nextScheduledDate" in body) data.nextScheduledDate = body.nextScheduledDate ? new Date(body.nextScheduledDate) : null;

    const trimming = await prisma.trimming.update({ where: { id }, data });
    return Response.json(trimming);
  } catch {
    return Response.json({ error: "更新できませんでした" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    const existing = await prisma.trimming.findFirst({
      where: { id, deletedAt: null, pet: { userId: uid } },
    });
    if (!existing) return Response.json({ error: "見つかりません" }, { status: 404 });

    await prisma.trimming.update({ where: { id }, data: { deletedAt: new Date() } });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "削除できませんでした" }, { status: 400 });
  }
}
