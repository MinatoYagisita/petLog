export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["done", "skipped", "failed", "delayed"],
  delayed: ["done"],
  scheduled: ["pending", "done", "skipped"],
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { uid } = await verifyAuth(req);
    const { id } = await params;

    // Verify ownership through medication → pet → user chain
    const log = await prisma.medicationLog.findFirst({
      where: { id },
      include: { schedule: { include: { medication: { include: { pet: true } } } } },
    });

    if (!log || log.schedule.medication.pet.userId !== uid) {
      return Response.json({ error: "見つかりません" }, { status: 404 });
    }

    const body = await req.json();
    const { status, note } = body as { status: string; note?: string };

    const allowed = VALID_TRANSITIONS[log.status] ?? [];
    if (!allowed.includes(status)) {
      return Response.json(
        { error: `${log.status} から ${status} への変更はできません` },
        { status: 422 }
      );
    }

    const updated = await prisma.medicationLog.update({
      where: { id },
      data: {
        status,
        actualTime: status === "done" ? new Date() : undefined,
        note: note ?? log.note,
      },
    });
    return Response.json(updated);
  } catch {
    return Response.json({ error: "更新できませんでした" }, { status: 400 });
  }
}
