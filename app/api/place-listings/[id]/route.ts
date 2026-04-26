import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = await prisma.placeListing.findUnique({ where: { id } });
  if (!listing || listing.status !== "approved") {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(listing);
}
