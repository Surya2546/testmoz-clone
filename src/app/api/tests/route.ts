// src/app/api/tests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tests = await prisma.test.findMany({
    where: { ownerId: session.user.id },
    include: {
      questions: { orderBy: { order: "asc" } },
      settings: true,
      _count: { select: { attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tests);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const test = await prisma.test.create({
    data: {
      title: body.title || "Untitled test",
      status: "DRAFT",
      passcode: body.passcode || null,
      timeLimit: body.timeLimit || 0,
      ownerId: session.user.id,
      settings: {
        create: {
          shuffleQuestions: false,
          shuffleOptions: false,
          showScore: true,
          showAnswers: true,
          maxAttempts: 1,
          passingScore: 60,
          onePerPage: false,
        },
      },
    },
    include: { questions: true, settings: true, _count: { select: { attempts: true } } },
  });
  return NextResponse.json(test, { status: 201 });
}
