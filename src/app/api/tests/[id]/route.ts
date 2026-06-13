// src/app/api/tests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ownsTest(testId: string, userId: string) {
  const test = await prisma.test.findFirst({ where: { id: testId, ownerId: userId } });
  return !!test;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const test = await prisma.test.findFirst({
    where: { id: params.id, ownerId: session.user.id },
    include: {
      questions: { orderBy: { order: "asc" } },
      settings: true,
      attempts: {
        orderBy: { submittedAt: "desc" },
        include: { answers: { include: { question: { select: { text: true, type: true } } } } },
      },
    },
  });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(test);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await ownsTest(params.id, session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { questions, settings, ...testData } = body;

  // Update test core fields
  await prisma.test.update({
    where: { id: params.id },
    data: {
      title: testData.title,
      status: testData.status,
      passcode: testData.passcode || null,
      timeLimit: testData.timeLimit || 0,
    },
  });

  // Upsert settings
  if (settings) {
    await prisma.testSettings.upsert({
      where: { testId: params.id },
      update: settings,
      create: { ...settings, testId: params.id },
    });
  }

  // Sync questions: delete removed, upsert existing/new
  if (questions) {
    const incoming = questions as Array<{
      id?: string; type: string; text: string; points: number;
      options: string[]; correctIndex?: number | null;
      correctBool?: boolean | null; correctText?: string | null;
      explanation?: string | null; order: number;
    }>;

    const incomingIds = incoming.filter(q => q.id).map(q => q.id as string);
    await prisma.question.deleteMany({
      where: { testId: params.id, id: { notIn: incomingIds } },
    });

    for (const q of incoming) {
      const data = {
        type: q.type as any,
        text: q.text || "",
        points: q.points ?? 1,
        options: q.options || [],
        correctIndex: q.correctIndex ?? null,
        correctBool: q.correctBool ?? null,
        correctText: q.correctText ?? null,
        explanation: q.explanation ?? null,
        order: q.order ?? 0,
        testId: params.id,
      };
      if (q.id) {
        await prisma.question.update({ where: { id: q.id }, data });
      } else {
        await prisma.question.create({ data });
      }
    }
  }

  const updated = await prisma.test.findUnique({
    where: { id: params.id },
    include: {
      questions: { orderBy: { order: "asc" } },
      settings: true,
      _count: { select: { attempts: true } },
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await ownsTest(params.id, session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.test.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
