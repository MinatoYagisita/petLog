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

    const visits = await prisma.visit.findMany({
      where: { petId, deletedAt: null },
      include: { prescription: { include: { medications: true } } },
      orderBy: { visitDate: "desc" },
      take: 30,
    });
    return Response.json(visits);
  } catch {
    return unauthorized();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const body = await req.json();
    const { petId, visitDate, hospitalId, hospitalName, diagnosis, note, nextVisitDate, prescription } = body as {
      petId: string;
      visitDate: string;
      hospitalId?: string;
      hospitalName: string;
      diagnosis?: string;
      note?: string;
      nextVisitDate?: string;
      prescription?: {
        prescribedDate: string;
        medications: { name: string; dosage: string; frequency: number; duration: number }[];
      };
    };

    const pet = await prisma.pet.findFirst({ where: { id: petId, userId: uid, deletedAt: null } });
    if (!pet) return Response.json({ error: "ペットが見つかりません" }, { status: 404 });

    if (!hospitalName?.trim()) {
      return Response.json({ error: "病院名は必須です" }, { status: 400 });
    }

    // Visit + Prescription in one transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visit = await prisma.$transaction(async (tx: any) => {
      const v = await tx.visit.create({
        data: {
          petId,
          hospitalId: hospitalId ?? null,
          visitDate: new Date(visitDate),
          hospitalName: hospitalName.trim(),
          diagnosis: diagnosis?.trim() ?? null,
          note: note?.trim() ?? null,
          nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
        },
      });

      if (prescription?.medications?.length) {
        await tx.prescription.create({
          data: {
            petId,
            userId: uid,
            visitId: v.id,
            prescribedDate: new Date(prescription.prescribedDate || visitDate),
            medications: { create: prescription.medications },
          },
        });
      }

      return tx.visit.findUnique({
        where: { id: v.id },
        include: { prescription: { include: { medications: true } } },
      });
    });

    return Response.json(visit, { status: 201 });
  } catch {
    return unauthorized();
  }
}
