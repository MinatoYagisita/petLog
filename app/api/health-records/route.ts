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

    const records = await prisma.healthRecord.findMany({
      where: { petId, deletedAt: null },
      orderBy: { recordedAt: "desc" },
      take: 50,
    });
    return Response.json(records);
  } catch {
    return unauthorized();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const body = await req.json() as {
      petId: string;
      condition?: string;
      walked?: boolean;
      walkMinutes?: number;
      recordedAt?: string;
      isBackfilled?: boolean;
      weight?: number;
      temperature?: number;
      mealCount?: number;
      mealAmount?: number;
      waterCount?: number;
      urineCount?: number;
      fecalCount?: number;
      fecalType?: number;
      vomitCount?: number;
      activityLevel?: number;
    };
    const { petId, condition, walked, walkMinutes, recordedAt, isBackfilled, ...rest } = body;

    const pet = await prisma.pet.findFirst({ where: { id: petId, userId: uid, deletedAt: null } });
    if (!pet) return Response.json({ error: "ペットが見つかりません" }, { status: 404 });

    const now = new Date();
    const recorded = recordedAt ? new Date(recordedAt) : now;
    const backfilled = isBackfilled ?? recorded.getTime() < now.getTime() - 60_000;

    const record = await prisma.healthRecord.create({
      data: {
        petId,
        condition: condition ?? "normal",
        walked: walked ?? false,
        walkMinutes: walkMinutes ?? null,
        recordedAt: recorded,
        isBackfilled: backfilled,
        ...rest,
      },
    });
    return Response.json(record, { status: 201 });
  } catch {
    return unauthorized();
  }
}
