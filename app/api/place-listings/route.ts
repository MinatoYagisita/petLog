import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const q = searchParams.get("q")?.trim() ?? "";

  const where: Record<string, unknown> = { status: "approved" };
  if (type) where.type = type;
  if (q) where.name = { contains: q };

  const listings = await prisma.placeListing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      name: true,
      phone: true,
      address: true,
      lat: true,
      lng: true,
      photoUrl: true,
    },
  });

  return Response.json(listings);
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "認証が必要です" }, { status: 401 });
  }

  let decoded: { uid: string };
  try {
    decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  } catch {
    return Response.json({ error: "認証が必要です" }, { status: 401 });
  }

  const account = await prisma.placeAccount.findUnique({ where: { id: decoded.uid } });
  if (!account) {
    return Response.json({ error: "施設アカウントが必要です" }, { status: 403 });
  }

  const body = await req.json();
  const { name, phone, photoUrl, address, lat, lng } = body;

  if (!name?.trim()) {
    return Response.json({ error: "名前は必須です" }, { status: 400 });
  }

  const listing = await prisma.placeListing.create({
    data: {
      accountId: decoded.uid,
      type: account.accountType,
      name: name.trim(),
      phone: phone?.trim() || null,
      photoUrl: photoUrl || null,
      address: address?.trim() || null,
      lat: lat ?? null,
      lng: lng ?? null,
      status: "pending",
    },
  });

  return Response.json(listing, { status: 201 });
}
