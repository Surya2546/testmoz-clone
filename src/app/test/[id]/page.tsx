// src/app/test/[id]/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import QuestionCard from "@/components/QuestionCard";
import { Btn, Badge, Card, Input, Toggle, Spinner } from "@/components/ui";

type Question = {
  id?: string; type: string; text: string; points: number;
  options: string[]; correctIndex?: number | null;
  correctBool?: boolean | null; correctText?: string | null;
  explanation?: string | null; order: number;
};
type Settings = {
  shuffleQuestions: boolean; shuffleOptions: boolean;
  showScore: boolean; showAnswers: boolean;
  maxAttempts: number; passingScore: number; onePerPage: boolean;
};
type Attempt = {
  id: string; takerName: string; score: number; totalPoints: number;
  percentage: number; timeTaken: number; submittedAt: string;
};
type Test = {
  id: string; title: string; status: "DRAFT" | "PUBLISHED";
  passcode: string | null; timeLimit: number;
  questions: Question[]; settings: Settings | null;
  attempts: Attempt[];
};

const uid = () => Math.random().toString(36).slice(2, 9);
const defaultSettings: Settings = { shuffleQuestions: false, shuffleOptions: false, showScore: true, showAnswers: true, maxAttempts: 1, passingScore: 60, onePerPage: false };

export default function TestEditorPage({ params }: { params: { id: string } }) {
  const { status } = useSession();
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [activeTab, setActiveTab] = useState("questions");
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (status === "unauthenticated") router.replace("/login"); }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/tests/${params.id}`).then(r => r.json()).then(d => setTest(d));
  }, [status, params.id]);

  const update = (patch: Partial<Test>) => setTest(t => t ? { ...t, ...patch } : t);
  const setSettings = (patch: Partial<Settings>) => setTest(t => t ? { ...t, settings: { ...(t.settings || defaultSettings), ...patch } } : t);

  const addQuestion = () => {
    const q: Question = { id: `new-${uid()}`, type: "multiple_choice", text: "", points: 1, options: ["", "", "", ""], correctIndex: 0, explanation: "", order: (test?.questions.length || 0) };
    update({ questions: [...(test?.questions || []), q] });
    setExpandedQ(q.id!);
  };

  const updateQ = (id: string, patch: Partial<Question>) => {
    update({ questions: test!.questions.map(q => q.id === id ? { ...q, ...patch } : q) });
  };

  const deleteQ = (id: string) => {
    update({ questions: test!.questions.filter(q => q.id !== id) });
    if (expandedQ === id) setExpandedQ(null);
  };

  const save = useCallback(async () => {
    if (!test) return;
    setSaving(true);
    const payload = {
      title: test.title, status: test.status,
      passcode: test.passcode || null, timeLimit: test.timeLimit,
      settings: test.settings || defaultSettings,
      questions: test.questions.map((q, i) => ({
        ...q,
        id: q.id?.startsWith("new-") ? undefined : q.id,
        order: i,
      })),
    };
    const res = await fetch(`/api/tests/${params.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const updated = await res.json();
    // Preserve attempts from current state since PUT response doesn't include them
    setTest(prev => ({ ...updated, attempts: prev?.attempts || [] }));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [test, params.id]);

  if (!test) return <><Navbar /><div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Spinner /></div></>;

  const settings = test.settings || defaultSettings;

  return (
    <>
      <Navbar />
      <div style={{ padding: "1.5rem", maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
          <Link href="/dashboard"><Btn size="sm">← Back</Btn></Link>
          <div style={{ flex: 1 }}>
            <Input value={test.title} onChange={v => update({ title: v })} placeholder="Test title…" style={{ fontSize: 15, fontWeight: 500 }} />
          </div>
          <Badge color={test.status === "PUBLISHED" ? "success" : "default"}>
            {test.status === "PUBLISHED" ? "Published" : "Draft"}
          </Badge>
          <Btn variant={test.status === "PUBLISHED" ? "default" : "success"} size="sm"
            onClick={() => update({ status: test.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" })}>
            {test.status === "PUBLISHED" ? "Unpublish" : "Publish"}
          </Btn>
          {test.status === "PUBLISHED" && (
            <Link href={`/take/${test.id}`} target="_blank"><Btn size="sm">Preview ↗</Btn></Link>
          )}
          <Btn variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
          </Btn>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: "1.25rem", borderBottom: "0.5px solid var(--border)" }}>
          {["questions", "settings", "results"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "8px 18px", fontSize: 13, fontWeight: activeTab === tab ? 500 : 400, background: "none", border: "none", cursor: "pointer", color: activeTab === tab ? "#4F46E5" : "var(--text-secondary)", borderBottom: activeTab === tab ? "2px solid #4F46E5" : "2px solid transparent", marginBottom: -1, textTransform: "capitalize" }}>{tab}</button>
          ))}
        </div>

        {/* Questions tab */}
        {activeTab === "questions" && (
          <div>
            {test.questions.length === 0 ? (
              <Card style={{ textAlign: "center", padding: "2.5rem" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 12px" }}>No questions yet.</p>
                <Btn variant="primary" onClick={addQuestion}>＋ Add first question</Btn>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {test.questions.map((q, i) => (
                  <QuestionCard key={q.id} q={q} index={i}
                    expanded={expandedQ === q.id}
                    onToggle={() => setExpandedQ(expandedQ === q.id ? null : (q.id || null))}
                    onUpdate={patch => updateQ(q.id!, patch)}
                    onDelete={() => deleteQ(q.id!)}
                  />
                ))}
              </div>
            )}
            {test.questions.length > 0 && (
              <div style={{ marginTop: 12 }}><Btn onClick={addQuestion}>＋ Add question</Btn></div>
            )}
          </div>
        )}

        {/* Settings tab */}
        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 500, margin: "0 0 14px" }}>Test access</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Passcode</label>
                  <Input value={test.passcode || ""} onChange={v => update({ passcode: v })} placeholder="Enter passcode…" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Time limit (minutes, 0 = none)</label>
                  <Input type="number" value={test.timeLimit} onChange={v => update({ timeLimit: parseInt(v) || 0 })} />
                </div>
              </div>
              {test.status === "PUBLISHED" && (
                <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", fontSize: 12 }}>
                  🔗 Share link: <strong>{typeof window !== "undefined" ? window.location.origin : ""}/take/{test.id}</strong>
                  {test.passcode && <span style={{ color: "var(--text-secondary)" }}> · Passcode: <strong>{test.passcode}</strong></span>}
                </div>
              )}
            </Card>
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 500, margin: "0 0 14px" }}>Scoring & results</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Passing score (%)</label>
                    <Input type="number" value={settings.passingScore} onChange={v => setSettings({ passingScore: parseInt(v) || 0 })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Max attempts</label>
                    <Input type="number" value={settings.maxAttempts} onChange={v => setSettings({ maxAttempts: parseInt(v) || 1 })} />
                  </div>
                </div>
                <Toggle checked={settings.showScore} onChange={v => setSettings({ showScore: v })} label="Show score after submission" />
                <Toggle checked={settings.showAnswers} onChange={v => setSettings({ showAnswers: v })} label="Show correct answers after submission" />
              </div>
            </Card>
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 500, margin: "0 0 14px" }}>Question display</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Toggle checked={settings.shuffleQuestions} onChange={v => setSettings({ shuffleQuestions: v })} label="Shuffle question order" />
                <Toggle checked={settings.shuffleOptions} onChange={v => setSettings({ shuffleOptions: v })} label="Shuffle answer choices" />
                <Toggle checked={settings.onePerPage} onChange={v => setSettings({ onePerPage: v })} label="One question per page" />
              </div>
            </Card>
          </div>
        )}

        {/* Results tab */}
        {activeTab === "results" && (
          <div>
            {(test.attempts ?? []).length === 0 ? (
              <Card style={{ textAlign: "center", padding: "2.5rem" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>No submissions yet for this test.</p>
              </Card>
            ) : (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                  {(() => {
                    const attempts = test.attempts ?? [];
                    const avg = Math.round(attempts.reduce((s, r) => s + r.percentage, 0) / attempts.length);
                    const passing = attempts.filter(r => r.percentage >= (settings.passingScore || 0)).length;
                    const highest = Math.max(...attempts.map(r => r.percentage));
                    return [
                      { label: "Average score", value: `${avg}%` },
                      { label: "Pass rate", value: `${Math.round((passing / attempts.length) * 100)}%` },
                      { label: "Top score", value: `${highest}%` },
                    ].map(s => (
                      <div key={s.label} style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ fontSize: 24, fontWeight: 500 }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</div>
                      </div>
                    ));
                  })()}
                </div>
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "var(--bg-secondary)" }}>
                        {["Name", "Score", "Date", "Time taken"].map(h => (
                          <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: 500, fontSize: 12, color: "var(--text-secondary)", borderBottom: "0.5px solid var(--border)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(test.attempts ?? []).map((r, i) => {
                        const attempts = test.attempts ?? [];
                        const passed = r.percentage >= (settings.passingScore || 0);
                        const mins = Math.floor(r.timeTaken / 60);
                        const secs = r.timeTaken % 60;
                        return (
                          <tr key={r.id} style={{ borderBottom: i < attempts.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                            <td style={{ padding: "10px 14px", fontWeight: 500 }}>{r.takerName}</td>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ flex: 1, height: 4, background: "var(--bg-secondary)", borderRadius: 2, overflow: "hidden", maxWidth: 80 }}>
                                  <div style={{ height: "100%", width: `${r.percentage}%`, background: passed ? "#10B981" : "#EF4444" }} />
                                </div>
                                <span style={{ fontWeight: 500, color: passed ? "#065F46" : "#991B1B" }}>{r.percentage}%</span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>{new Date(r.submittedAt).toLocaleDateString()}</td>
                            <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>{mins}m {secs}s</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}