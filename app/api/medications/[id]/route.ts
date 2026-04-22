export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    const medication = await prisma.medication.findFirst({
      where: { id, deletedAt: null, pet: { userId: uid } },
      include: { schedules: { include: { logs: { orderBy: { date: "desc" }, take: 30 } } } },
    });
    if (!medication) return Response.json({ error: "見つかりません" }, { status: 404 });
    return Response.json(medication);
  } catch {
    return Response.json({ error: "見つかりません" }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    const existing = await prisma.medication.findFirst({
      where: { id, deletedAt: null, pet: { userId: uid } },
    });
    if (!existing) return Response.json({ error: "見つかりません" }, { status: 404 });

    const body = await req.json();
    const medication = await prisma.medication.update({
      where: { id },
      data: {
        name: body.name?.trim(),
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
    });
    return Response.json(medication);
  } catch {
    return Response.json({ error: "更新できませんでした" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    const existing = await prisma.medication.findFirst({
      where: { id, deletedAt: null, pet: { userId: uid } },
    });
    if (!existing) return Response.json({ error: "見つかりません" }, { status: 404 });

    await prisma.medication.update({ where: { id }, data: { deletedAt: new Date() } });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "削除できませんでした" }, { status: 400 });
  }
}
