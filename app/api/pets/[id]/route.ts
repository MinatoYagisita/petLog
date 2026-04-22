export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

async function findOwnedPet(uid: string, petId: string) {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, userId: uid, deletedAt: null },
  });
  if (!pet) throw new Error("Not found");
  return pet;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;
    const pet = await findOwnedPet(uid, id);
    return Response.json(pet);
  } catch {
    return Response.json({ error: "見つかりません" }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;
    await findOwnedPet(uid, id);

    const body = await req.json() as {
      name?: string;
      type?: string;
      gender?: string | null;
      birthday?: string | null;
      size?: string | null;
      neutered?: boolean | null;
      photoUrl?: string | null;
    };

    const data: Record<string, unknown> = {};
    if (body.name) data.name = body.name.trim();
    if (body.type) data.type = body.type.trim();
    if ("gender" in body) data.gender = body.gender || null;
    if ("birthday" in body) data.birthday = body.birthday ? new Date(body.birthday) : null;
    if ("size" in body) data.size = body.size || null;
    if ("neutered" in body) data.neutered = body.neutered ?? null;
    if ("photoUrl" in body) data.photoUrl = body.photoUrl || null;

    const pet = await prisma.pet.update({
      where: { id },
      data,
    });
    return Response.json(pet);
  } catch {
    return Response.json({ error: "更新できませんでした" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;
    await findOwnedPet(uid, id);

    await prisma.pet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "削除できませんでした" }, { status: 400 });
  }
}
