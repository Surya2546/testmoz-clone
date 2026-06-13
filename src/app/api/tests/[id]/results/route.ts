// src/app/api/tests/[id]/results/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const test = await prisma.test.findFirst({
    where: { id: params.id, ownerId: session.user.id },
  });
  if (!test) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const attempts = await prisma.attempt.findMany({
    where: { testId: params.id },
    orderBy: { submittedAt: "desc" },
    include: {
      answers: {
        include: { question: { select: { text: true, type: true, points: true } } },
      },
    },
  });
  return NextResponse.json(attempts);
}
