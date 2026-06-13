// src/app/api/tests/[id]/attempt/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: fetch published test for takers (validates passcode, no auth required)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const passcode = searchParams.get("passcode");

  const test = await prisma.test.findUnique({
    where: { id: params.id },
    include: {
      questions: { orderBy: { order: "asc" } },
      settings: true,
    },
  });

  if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
  if (test.status !== "PUBLISHED") return NextResponse.json({ error: "Test not available" }, { status: 403 });
  if (test.passcode && test.passcode !== passcode) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }

  // Strip correct answers before sending to taker
  const safe = {
    ...test,
    questions: test.questions.map(q => ({
      id: q.id,
      type: q.type,
      text: q.text,
      points: q.points,
      options: q.options,
      order: q.order,
      // correctIndex, correctBool, correctText intentionally omitted
    })),
  };
  return NextResponse.json(safe);
}

// POST: submit an attempt
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { takerName, answers, timeTaken } = body as {
    takerName: string;
    answers: Record<string, { index?: number; bool?: boolean; text?: string }>;
    timeTaken: number;
  };

  const test = await prisma.test.findUnique({
    where: { id: params.id },
    include: { questions: true, settings: true },
  });
  if (!test || test.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Test not available" }, { status: 403 });
  }

  // Check attempt limit
  if (test.settings?.maxAttempts) {
    const count = await prisma.attempt.count({ where: { testId: params.id, takerName } });
    if (count >= test.settings.maxAttempts) {
      return NextResponse.json({ error: "Max attempts reached" }, { status: 429 });
    }
  }

  // Grade answers
  let earned = 0;
  const totalPoints = test.questions.reduce((s, q) => s + q.points, 0);
  const gradedAnswers: Array<{
    questionId: string; answerIndex?: number | null; answerBool?: boolean | null;
    answerText?: string | null; isCorrect: boolean; pointsEarned: number;
  }> = [];

  for (const q of test.questions) {
    const ans = answers[q.id];
    let isCorrect = false;
    let pointsEarned = 0;

    if (q.type === "multiple_choice" && ans?.index !== undefined) {
      isCorrect = ans.index === q.correctIndex;
    } else if (q.type === "true_false" && ans?.bool !== undefined) {
      isCorrect = ans.bool === q.correctBool;
    } else if ((q.type === "fill_blank" || q.type === "short_answer") && ans?.text) {
      isCorrect = ans.text.trim().toLowerCase() === (q.correctText || "").trim().toLowerCase();
    }
    // essay: always false (manual grading)

    if (isCorrect) { pointsEarned = q.points; earned += q.points; }

    gradedAnswers.push({
      questionId: q.id,
      answerIndex: ans?.index ?? null,
      answerBool: ans?.bool ?? null,
      answerText: ans?.text ?? null,
      isCorrect,
      pointsEarned,
    });
  }

  const percentage = totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0;

  const attempt = await prisma.attempt.create({
    data: {
      takerName: takerName || "Anonymous",
      score: earned,
      totalPoints,
      percentage,
      timeTaken: timeTaken || 0,
      testId: params.id,
      answers: { create: gradedAnswers },
    },
    include: { answers: true },
  });

  return NextResponse.json({
    id: attempt.id,
    score: earned,
    totalPoints,
    percentage,
    passed: percentage >= (test.settings?.passingScore ?? 0),
    passingScore: test.settings?.passingScore ?? 0,
    answers: attempt.answers,
    showScore: test.settings?.showScore ?? true,
    showAnswers: test.settings?.showAnswers ?? true,
    timeTaken,
  }, { status: 201 });
}
