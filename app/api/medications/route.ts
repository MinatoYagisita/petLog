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
      where: { petId, deletedAt: null },
      include: { schedules: true },
      orderBy: { startDate: "desc" },
    });
    return Response.json(medications);
  } catch {
    return unauthorized();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const body = await req.json();
    const { petId, name, startDate, endDate, times, stockCount, doseAmount, stockUnit, note } = body as {
      petId: string;
      name: string;
      startDate: string;
      endDate?: string;
      times: string[];
      stockCount?: number;
      doseAmount?: number;
      stockUnit?: string;
      note?: string;
    };

    const pet = await prisma.pet.findFirst({ where: { id: petId, userId: uid, deletedAt: null } });
    if (!pet) return Response.json({ error: "ペットが見つかりません" }, { status: 404 });

    if (!name?.trim() || !times?.length) {
      return Response.json({ error: "薬名と投薬時間は必須です" }, { status: 400 });
    }

    const medication = await prisma.medication.create({
      data: {
        petId,
        name: name.trim(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        stockCount: stockCount ?? null,
        doseAmount: doseAmount ?? null,
        stockUnit: stockUnit ?? null,
        note: note ?? null,
        schedules: {
          create: times.map((time) => ({ time })),
        },
      },
      include: { schedules: true },
    });
    return Response.json(medication, { status: 201 });
  } catch {
    return unauthorized();
  }
}
