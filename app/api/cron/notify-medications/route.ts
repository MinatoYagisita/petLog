export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminMessaging } from "@/lib/firebase-admin";

function jstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

async function sendIfNew(
  userId: string,
  type: string,
  rid: string,
  tokens: string[],
  title: string,
  body: string,
) {
  if (!tokens.length) return;
  const existing = await prisma.notificationLog.findUnique({
    where: { userId_type_refId: { userId, type, refId: rid } },
  });
  if (existing) return;

  await adminMessaging.sendEachForMulticast({ tokens, notification: { title, body } });
  await prisma.notificationLog.create({ data: { userId, type, refId: rid } });
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = jstNow();
  const todayJst = now.toISOString().slice(0, 10);
  let sent = 0;

  const logs = await prisma.medicationLog.findMany({
    where: { date: todayJst, status: { in: ["pending", "scheduled"] } },
    include: {
      schedule: {
        include: {
          medication: {
            include: {
              pet: {
                include: {
                  user: { include: { fcmTokens: true, notificationSetting: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  for (const log of logs) {
    const med = log.schedule.medication;
    const { pet } = med;
    const { user } = pet;
    const setting = user.notificationSetting;
    const tokens = user.fcmTokens.map((t) => t.token);
    if (!tokens.length) continue;

    const [h, m] = log.schedule.time.split(":").map(Number);
    const scheduledAt = new Date(now);
    scheduledAt.setUTCHours(h, m, 0, 0);
    const diffMin = Math.round((scheduledAt.getTime() - now.getTime()) / 60000);

    if ((setting?.medReminder ?? true) && diffMin >= -8 && diffMin <= -2) {
      await sendIfNew(
        user.id, "med_reminder", `med_reminder:${log.id}`, tokens,
        `${pet.name}の投薬時間まであと5分`,
        `${med.name}（${log.schedule.time}）`,
      );
      sent++;
    }

    if ((setting?.medOverdue ?? true) && diffMin >= -65 && diffMin <= -55) {
      await sendIfNew(
        user.id, "med_overdue", `med_overdue:${log.id}`, tokens,
        `${pet.name}の投薬が未対応です`,
        `${med.name}（${log.schedule.time}）をまだ投薬していません`,
      );
      sent++;
    }
  }

  return Response.json({ sent });
}
