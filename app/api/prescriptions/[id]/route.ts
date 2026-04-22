export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    const prescription = await prisma.prescription.findFirst({
      where: { id, userId: uid, deletedAt: null },
      include: {
        medications: true,
        visit: { select: { hospitalName: true, visitDate: true, diagnosis: true } },
      },
    });
    if (!prescription) return Response.json({ error: "見つかりません" }, { status: 404 });
    return Response.json(prescription);
  } catch {
    return Response.json({ error: "見つかりません" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    const existing = await prisma.prescription.findFirst({ where: { id, userId: uid, deletedAt: null } });
    if (!existing) return Response.json({ error: "見つかりません" }, { status: 404 });

    await prisma.prescription.update({ where: { id }, data: { deletedAt: new Date() } });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "削除できませんでした" }, { status: 400 });
  }
}
