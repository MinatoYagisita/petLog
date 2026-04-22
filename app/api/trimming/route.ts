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

    const trimmings = await prisma.trimming.findMany({
      where: { petId, deletedAt: null },
      orderBy: { scheduledDate: "desc" },
      take: 30,
    });
    return Response.json(trimmings);
  } catch {
    return unauthorized();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const body = await req.json() as {
      petId: string;
      salonId?: string;
      salonName?: string;
      scheduledDate: string;
      completedDate?: string;
      content?: string;
      cost?: number;
      note?: string;
      nextScheduledDate?: string;
    };

    const pet = await prisma.pet.findFirst({ where: { id: body.petId, userId: uid, deletedAt: null } });
    if (!pet) return Response.json({ error: "ペットが見つかりません" }, { status: 404 });

    if (!body.scheduledDate) {
      return Response.json({ error: "予定日は必須です" }, { status: 400 });
    }

    let salonName = body.salonName?.trim() ?? null;
    if (body.salonId && !salonName) {
      const salon = await prisma.salon.findFirst({ where: { id: body.salonId, userId: uid, deletedAt: null } });
      if (salon) salonName = salon.name;
    }

    const trimming = await prisma.trimming.create({
      data: {
        petId: body.petId,
        salonId: body.salonId ?? null,
        salonName,
        scheduledDate: new Date(body.scheduledDate),
        completedDate: body.completedDate ? new Date(body.completedDate) : null,
        content: body.content?.trim() ?? null,
        cost: body.cost ?? null,
        note: body.note?.trim() ?? null,
        nextScheduledDate: body.nextScheduledDate ? new Date(body.nextScheduledDate) : null,
      },
    });
    return Response.json(trimming, { status: 201 });
  } catch {
    return unauthorized();
  }
}
