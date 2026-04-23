export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

const DEFAULTS = {
  medReminder: true,
  medOverdue: true,
  stockAlert: true,
  visitReminder: true,
  trimmingReminder: true,
  healthPrompt: false,
  stockThreshold: 7,
};

export async function GET(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const setting = await prisma.notificationSetting.findUnique({ where: { userId: uid } });
    return Response.json(setting ?? { userId: uid, ...DEFAULTS });
  } catch {
    return unauthorized();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { uid } = await verifyAuth(req);
    const body = await req.json() as Partial<typeof DEFAULTS>;

    const data: Partial<typeof DEFAULTS> = {};
    if (body.medReminder !== undefined) data.medReminder = body.medReminder;
    if (body.medOverdue !== undefined) data.medOverdue = body.medOverdue;
    if (body.stockAlert !== undefined) data.stockAlert = body.stockAlert;
    if (body.visitReminder !== undefined) data.visitReminder = body.visitReminder;
    if (body.trimmingReminder !== undefined) data.trimmingReminder = body.trimmingReminder;
    if (body.healthPrompt !== undefined) data.healthPrompt = body.healthPrompt;
    if (body.stockThreshold !== undefined) data.stockThreshold = Number(body.stockThreshold);

    const setting = await prisma.notificationSetting.upsert({
      where: { userId: uid },
      update: data,
      create: { userId: uid, ...DEFAULTS, ...data },
    });
    return Response.json(setting);
  } catch {
    return unauthorized();
  }
}
