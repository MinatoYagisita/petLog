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

    const prescriptions = await prisma.prescription.findMany({
      where: { petId, userId: uid, deletedAt: null },
      include: {
        medications: true,
        visit: { select: { hospitalName: true, visitDate: true } },
      },
      orderBy: { prescribedDate: "desc" },
      take: 30,
    });
    return Response.json(prescriptions);
  } catch {
    return unauthorized();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const body = await req.json() as {
      petId: string;
      prescribedDate: string;
      medications: { name: string; dosage: string; frequency: number; duration: number }[];
    };

    const pet = await prisma.pet.findFirst({ where: { id: body.petId, userId: uid, deletedAt: null } });
    if (!pet) return Response.json({ error: "ペットが見つかりません" }, { status: 404 });

    if (!body.medications?.length) {
      return Response.json({ error: "薬が1つ以上必要です" }, { status: 400 });
    }

    const prescription = await prisma.prescription.create({
      data: {
        petId: body.petId,
        userId: uid,
        prescribedDate: new Date(body.prescribedDate),
        medications: { create: body.medications },
      },
      include: { medications: true },
    });
    return Response.json(prescription, { status: 201 });
  } catch {
    return unauthorized();
  }
}
