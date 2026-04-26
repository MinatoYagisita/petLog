export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const petId = searchParams.get("petId");
    if (!petId) return Response.json({ error: "petId は必須です" }, { status: 400 });

    const pet = await prisma.pet.findFirst({ where: { id: petId, userId: uid, deletedAt: null } });
    if (!pet) return Response.json({ error: "ペットが見つかりません" }, { status: 404 });

    const medications = await prisma.medication.findMany({
      where: {
        petId,
        deletedAt: null,
        stockCount: { not: null },
        doseAmount: { not: null },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      include: { schedules: { select: { id: true } } },
    });

    const lowStock = medications
      .map((m) => {
        const perDay = m.doseAmount! * m.schedules.length;
        const remainingDays = perDay > 0 ? Math.floor(m.stockCount! / perDay) : null;
        return { id: m.id, name: m.name, stockCount: m.stockCount, stockUnit: m.stockUnit, remainingDays };
      })
      .filter((m) => m.remainingDays !== null && m.remainingDays <= 7);

    return Response.json(lowStock);
  } catch {
    return unauthorized();
  }
}
