export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminMessaging } from "@/lib/firebase-admin";

function jstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function jstTomorrow(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000 + 86400000).toISOString().slice(0, 10);
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

  const today = jstToday();
  const tomorrow = jstTomorrow();
  let sent = 0;

  const users = await prisma.user.findMany({
    include: {
      fcmTokens: true,
      notificationSetting: true,
      pets: {
        where: { deletedAt: null },
        include: {
          visits: {
            where: { nextVisitDate: { not: null }, deletedAt: null },
            orderBy: { nextVisitDate: "asc" },
            take: 1,
          },
          trimmings: {
            where: { completedDate: null, deletedAt: null },
            orderBy: { scheduledDate: "asc" },
            take: 1,
          },
          medications: {
            where: { deletedAt: null },
            include: { schedules: true },
          },
          healthRecords: {
            where: { deletedAt: null },
            orderBy: { recordedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  for (const user of users) {
    const setting = user.notificationSetting;
    const tokens = user.fcmTokens.map((t) => t.token);
    if (!tokens.length) continue;

    for (const pet of user.pets) {
      // Visit reminders
      if (setting?.visitReminder ?? true) {
        const visit = pet.visits[0];
        if (visit?.nextVisitDate) {
          const dateStr = visit.nextVisitDate.toISOString().slice(0, 10);
          if (dateStr === today || dateStr === tomorrow) {
            const label = dateStr === today ? "本日" : "明日";
            await sendIfNew(
              user.id, "visit_reminder", `visit_reminder:${pet.id}:${dateStr}`, tokens,
              `${pet.name}の通院予定`,
              `${label}は通院予定日です`,
            );
            sent++;
          }
        }
      }

      // Trimming reminders
      if (setting?.trimmingReminder ?? true) {
        const trimming = pet.trimmings[0];
        if (trimming) {
          const dateStr = trimming.scheduledDate.toISOString().slice(0, 10);
          if (dateStr === today || dateStr === tomorrow) {
            const label = dateStr === today ? "本日" : "明日";
            await sendIfNew(
              user.id, "trimming_reminder", `trimming_reminder:${trimming.id}:${dateStr}`, tokens,
              `${pet.name}のトリミング予定`,
              `${label}はトリミング予定日です（${trimming.salonName ?? ""}）`,
            );
            sent++;
          }
        }
      }

      // Stock alerts
      if (setting?.stockAlert ?? true) {
        const threshold = setting?.stockThreshold ?? 7;
        for (const med of pet.medications) {
          if (med.stockCount == null || med.doseAmount == null || !med.schedules.length) continue;
          const dailyDose = med.doseAmount * med.schedules.length;
          const remainingDays = Math.floor(med.stockCount / dailyDose);
          if (remainingDays <= threshold) {
            await sendIfNew(
              user.id, "stock_alert", `stock_alert:${med.id}:${today}`, tokens,
              `${pet.name}の薬の残量が少なくなっています`,
              `${med.name}の残りが約${remainingDays}日分です`,
            );
            sent++;
          }
        }
      }

      // Health prompt (send if no record today)
      if (setting?.healthPrompt ?? false) {
        const latestRecord = pet.healthRecords[0];
        const hasRecordToday = latestRecord
          ? latestRecord.recordedAt.toISOString().slice(0, 10) === today
          : false;
        if (!hasRecordToday) {
          await sendIfNew(
            user.id, "health_prompt", `health_prompt:${pet.id}:${today}`, tokens,
            `${pet.name}の健康記録を入力しましょう`,
            `今日の体調はいかがですか？`,
          );
          sent++;
        }
      }
    }
  }

  return Response.json({ sent });
}
