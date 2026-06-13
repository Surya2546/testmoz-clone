// src/app/take/[id]/page.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { Btn, Badge, Card, Input } from "@/components/ui";

type Question = { id: string; type: string; text: string; points: number; options: string[]; order: number };
type Test = {
  id: string; title: string; timeLimit: number; passcode: string | null;
  questions: Question[];
  settings: { shuffleQuestions: boolean; shuffleOptions: boolean; showScore: boolean; showAnswers: boolean; maxAttempts: number; passingScore: number; onePerPage: boolean } | null;
};
type Result = { score: number; totalPoints: number; percentage: number; passed: boolean; passingScore: number; showScore: boolean; showAnswers: boolean; answers: Array<{ questionId: string; isCorrect: boolean; pointsEarned: number; answerIndex?: number | null; answerBool?: boolean | null; answerText?: string | null }>; timeTaken: number };

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }
function formatTime(s: number) { const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, "0")}`; }

export default function TakePage({ params }: { params: { id: string } }) {
  const [step, setStep] = useState<"enter" | "taking" | "results">("enter");
  const [test, setTest] = useState<Test | null>(null);
  const [passcode, setPasscode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, { index?: number; bool?: boolean; text?: string }>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTest = async () => {
    setLoading(true); setError("");
    const res = await fetch(`/api/tests/${params.id}/attempt?passcode=${encodeURIComponent(passcode)}`);
    if (!res.ok) { const d = await res.json(); setError(d.error); setLoading(false); return; }
    const t: Test = await res.json();
    setTest(t);

    let qs = [...t.questions];
    if (t.settings?.shuffleQuestions) qs = shuffle(qs);
    if (t.settings?.shuffleOptions) {
      qs = qs.map(q => q.type === "multiple_choice" ? { ...q, options: shuffle(q.options) } : q);
    }
    setQuestions(qs);

    if (t.timeLimit && t.timeLimit > 0) {
      const secs = t.timeLimit * 60;
      setTimeLeft(secs);
    }
    setStartTime(Date.now());
    setStep("taking");
    setLoading(false);
  };

  useEffect(() => {
    if (step !== "taking") return;
    if (!test?.timeLimit) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current!); handleSubmit(); return 0; } return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const setAnswer = (qid: string, val: { index?: number; bool?: boolean; text?: string }) => {
    setAnswers(a => ({ ...a, [qid]: val }));
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    setLoading(true);
    const res = await fetch(`/api/tests/${params.id}/attempt`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ takerName: name, answers, timeTaken }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); setLoading(false); return; }
    const r = await res.json();
    setResult(r);
    setStep("results");
    setLoading(false);
  };

  const answered = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0;
  const onePerPage = test?.settings?.onePerPage ?? false;
  const qs = onePerPage ? [questions[currentQ]].filter(Boolean) : questions;

  if (step === "enter") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", padding: "1rem" }}>
      <Card style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Join Test</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "6px 0 0" }}>Enter your name to begin</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Your name</label>
            <Input value={name} onChange={setName} placeholder="Enter your name…" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Passcode (if required)</label>
            <Input value={passcode} onChange={setPasscode} placeholder="Leave blank if none…" />
          </div>
          {error && <p style={{ fontSize: 12, color: "#991B1B", margin: 0, background: "#FEF2F2", padding: "6px 10px", borderRadius: "var(--radius-md)" }}>{error}</p>}
          <Btn variant="primary" style={{ justifyContent: "center" }} onClick={fetchTest} disabled={loading || !name.trim()}>
            {loading ? "Loading…" : "Start test →"}
          </Btn>
        </div>
      </Card>
    </div>
  );

  if (step === "taking" && test) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-secondary)", padding: "1.5rem" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h1 style={{ fontSize: 17, fontWeight: 500, margin: 0 }}>{test.title}</h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {test.timeLimit > 0 && (
              <span style={{ fontSize: 13, fontWeight: 500, background: timeLeft < 60 ? "#FEF2F2" : "var(--bg)", padding: "4px 10px", borderRadius: "var(--radius-md)", border: "0.5px solid var(--border)", color: timeLeft < 60 ? "#991B1B" : "var(--text)" }}>
                ⏱ {formatTime(timeLeft)}
              </span>
            )}
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{answered}/{questions.length} answered</span>
          </div>
        </div>

        <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginBottom: "1.25rem", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#4F46E5", transition: "width 0.3s" }} />
        </div>

        {qs.map((q, qi) => {
          const realIdx = onePerPage ? currentQ : qi;
          const ans = answers[q.id] || {};
          return (
            <Card key={q.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#EEF2FF", color: "#4F46E5", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{realIdx + 1}</span>
                <p style={{ fontSize: 14, margin: 0, flex: 1 }}>{q.text || <em style={{ color: "var(--text-secondary)" }}>No question text</em>}</p>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{q.points} pt</span>
              </div>

              {q.type === "multiple_choice" && q.options.map((opt, oi) => {
                const originalQ = test.questions.find(oq => oq.id === q.id);
                const originalIndex = originalQ ? originalQ.options.indexOf(opt) : -1;
                const finalIndex = originalIndex >= 0 ? originalIndex : oi;
                return (
                  <label key={oi} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 6, cursor: "pointer", border: `0.5px solid ${ans.index === finalIndex ? "#4F46E5" : "var(--border)"}`, borderRadius: "var(--radius-md)", background: ans.index === finalIndex ? "rgba(79, 70, 229, 0.15)" : "var(--bg-secondary)", color: "var(--text)", fontSize: 13 }}>
                    <input type="radio" name={`q-${q.id}`} checked={ans.index === finalIndex} onChange={() => setAnswer(q.id, { index: finalIndex })} style={{ accentColor: "#4F46E5" }} />
                    {opt || <em style={{ color: "var(--text-secondary)" }}>Option {oi + 1}</em>}
                  </label>
                );
              })}

              {q.type === "true_false" && (
                <div style={{ display: "flex", gap: 10 }}>
                  {[true, false].map(v => (
                    <label key={String(v)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 10, cursor: "pointer", border: `0.5px solid ${ans.bool === v ? "#4F46E5" : "var(--border)"}`, borderRadius: "var(--radius-md)", background: ans.bool === v ? "rgba(79, 70, 229, 0.15)" : "var(--bg-secondary)", color: "var(--text)", fontSize: 13, fontWeight: 500 }}>
                      <input type="radio" checked={ans.bool === v} onChange={() => setAnswer(q.id, { bool: v })} style={{ accentColor: "#4F46E5" }} />
                      {v ? "True" : "False"}
                    </label>
                  ))}
                </div>
              )}

              {(q.type === "fill_blank" || q.type === "short_answer") && (
                <input value={ans.text || ""} onChange={e => setAnswer(q.id, { text: e.target.value })} placeholder="Your answer…"
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "0.5px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }} />
              )}

              {q.type === "essay" && (
                <textarea value={ans.text || ""} onChange={e => setAnswer(q.id, { text: e.target.value })} placeholder="Write your answer…" rows={4}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "0.5px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg)", color: "var(--text)", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
              )}
            </Card>
          );
        })}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {onePerPage ? (
            <>
              <Btn onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}>← Previous</Btn>
              {currentQ < questions.length - 1
                ? <Btn variant="primary" onClick={() => setCurrentQ(q => q + 1)}>Next →</Btn>
                : <Btn variant="primary" onClick={handleSubmit} disabled={loading}>Submit test →</Btn>
              }
            </>
          ) : (
            <div style={{ marginLeft: "auto" }}>
              <Btn variant="primary" onClick={handleSubmit} disabled={loading}>Submit test →</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (step === "results" && result) {
    const { percentage, passed, passingScore, showScore, showAnswers, score, totalPoints, timeTaken } = result;
    const mins = Math.floor(timeTaken / 60); const secs = timeTaken % 60;

    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-secondary)", padding: "1.5rem" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1.5rem" }}>Results</h1>

          {showScore && (
            <Card style={{ textAlign: "center", marginBottom: 16, background: passed ? "#ECFDF5" : "#FEF2F2" }}>
              <div style={{ fontSize: 44, fontWeight: 500, color: passed ? "#065F46" : "#991B1B" }}>{percentage}%</div>
              <div style={{ fontSize: 14, color: passed ? "#065F46" : "#991B1B", marginTop: 4 }}>
                {score} / {totalPoints} points · {passed ? "✓ Passed" : "✗ Did not pass"}
              </div>
              <div style={{ fontSize: 12, color: passed ? "#047857" : "#B91C1C", marginTop: 4 }}>Passing score: {passingScore}% · Time: {mins}m {secs}s</div>
            </Card>
          )}

          {showAnswers && test && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {questions.map((q, i) => {
                const ra = result.answers.find(a => a.questionId === q.id);
                const isCorrect = ra?.isCorrect || false;
                const isEssay = q.type === "essay";
                const originalQ = test.questions.find(oq => oq.id === q.id);
                return (
                  <Card key={q.id} style={{ borderLeft: `3px solid ${isEssay ? "#F59E0B" : isCorrect ? "#10B981" : "#EF4444"}`, borderRadius: "0 var(--radius-md) var(--radius-md) 0" }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Q{i + 1}</span>
                      <span style={{ fontSize: 13, flex: 1 }}>{q.text}</span>
                      <Badge color={isEssay ? "warning" : isCorrect ? "success" : "danger"}>
                        {isEssay ? "Manual grade" : isCorrect ? `✓ +${q.points}` : `✗ +0`}
                      </Badge>
                    </div>
                    {q.type === "multiple_choice" && ra?.answerIndex !== undefined && ra.answerIndex !== null && originalQ && (
                      <div style={{ paddingLeft: 20, fontSize: 12, color: "var(--text-secondary)" }}>Your answer: {originalQ.options[ra.answerIndex]}</div>
                    )}
                    {q.type === "true_false" && ra?.answerBool !== undefined && ra.answerBool !== null && (
                      <div style={{ paddingLeft: 20, fontSize: 12, color: "var(--text-secondary)" }}>Your answer: {ra.answerBool ? "True" : "False"}</div>
                    )}
                    {(q.type === "fill_blank" || q.type === "short_answer" || q.type === "essay") && ra?.answerText !== undefined && ra.answerText !== null && (
                      <div style={{ paddingLeft: 20, fontSize: 12, color: "var(--text-secondary)" }}>Your answer: {ra.answerText}</div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <Btn onClick={() => { setStep("enter"); setAnswers({}); setCurrentQ(0); setResult(null); }}>Take again</Btn>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
