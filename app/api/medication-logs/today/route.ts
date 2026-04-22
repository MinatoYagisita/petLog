export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const petId = searchParams.get("petId");
    if (!petId) return Response.json({ error: "petId は必須です" }, { status: 400 });

    const pet = await prisma.pet.findFirst({ where: { id: petId, userId: uid, deletedAt: null } });
    if (!pet) return Response.json({ error: "ペットが見つかりません" }, { status: 404 });

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Get active medications with their schedules
    const medications = await prisma.medication.findMany({
      where: {
        petId,
        deletedAt: null,
        startDate: { lte: todayEnd },
        OR: [{ endDate: null }, { endDate: { gte: todayStart } }],
      },
      include: {
        schedules: {
          include: {
            logs: {
              where: { date: { gte: todayStart, lte: todayEnd } },
            },
          },
        },
      },
    });

    // Build today's log entries, auto-creating missing ones
    const result: {
      logId: string;
      medicationId: string;
      medicationName: string;
      scheduleId: string;
      scheduledTime: string;
      status: string;
      actualTime: string | null;
      note: string | null;
    }[] = [];

    for (const med of medications) {
      for (const schedule of med.schedules) {
        let log = schedule.logs[0];

        if (!log) {
          // Auto-create pending log for today
          log = await prisma.medicationLog.create({
            data: {
              scheduleId: schedule.id,
              date: todayStart,
              status: "pending",
            },
          });
        }

        result.push({
          logId: log.id,
          medicationId: med.id,
          medicationName: med.name,
          scheduleId: schedule.id,
          scheduledTime: schedule.time,
          status: log.status,
          actualTime: log.actualTime?.toISOString() ?? null,
          note: log.note,
        });
      }
    }

    // Sort by scheduled time
    result.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    return Response.json(result);
  } catch {
    return unauthorized();
  }
}
