import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "認証が必要です" }, { status: 401 });
  }

  let decoded: { uid: string; email?: string };
  try {
    decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  } catch {
    return Response.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await req.json();
  const accountType: string = body.accountType;
  if (!["hospital", "salon"].includes(accountType)) {
    return Response.json({ error: "accountType は hospital または salon" }, { status: 400 });
  }

  try {
    const account = await prisma.placeAccount.upsert({
      where: { id: decoded.uid },
      update: {},
      create: {
        id: decoded.uid,
        email: decoded.email ?? "",
        accountType,
      },
    });
    return Response.json(account);
  } catch {
    return Response.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}
