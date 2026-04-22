export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const hospitals = await prisma.hospital.findMany({
      where: { userId: uid, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(hospitals);
  } catch {
    return unauthorized();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const { name, phone, note } = await req.json() as {
      name: string;
      phone?: string;
      note?: string;
    };

    if (!name?.trim()) {
      return Response.json({ error: "病院名は必須です" }, { status: 400 });
    }

    const hospital = await prisma.hospital.create({
      data: {
        userId: uid,
        name: name.trim(),
        phone: phone?.trim() ?? null,
        note: note?.trim() ?? null,
      },
    });
    return Response.json(hospital, { status: 201 });
  } catch {
    return unauthorized();
  }
}
