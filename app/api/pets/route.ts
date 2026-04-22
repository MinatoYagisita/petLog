export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const pets = await prisma.pet.findMany({
      where: { userId: uid, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(pets);
  } catch {
    return unauthorized();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const body = await req.json() as {
      name: string;
      type: string;
      gender?: string | null;
      birthday?: string | null;
      size?: string | null;
      neutered?: boolean | null;
      photoUrl?: string | null;
    };

    if (!body.name?.trim() || !body.type?.trim()) {
      return Response.json({ error: "名前と種別は必須です" }, { status: 400 });
    }

    const pet = await prisma.pet.create({
      data: {
        userId: uid,
        name: body.name.trim(),
        type: body.type.trim(),
        gender: body.gender || null,
        birthday: body.birthday ? new Date(body.birthday) : null,
        size: body.size || null,
        neutered: body.neutered ?? null,
        photoUrl: body.photoUrl || null,
      },
    });
    return Response.json(pet, { status: 201 });
  } catch {
    return unauthorized();
  }
}
