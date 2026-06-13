// src/app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Btn, Badge, Card, Spinner } from "@/components/ui";

type Test = {
  id: string; title: string; status: "DRAFT" | "PUBLISHED";
  timeLimit: number; passcode: string | null;
  questions: { id: string }[];
  _count: { attempts: number };
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/tests").then(r => r.json()).then(d => { setTests(d); setLoading(false); });
  }, [status]);

  const createTest = async () => {
    const res = await fetch("/api/tests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Untitled test" }) });
    const t = await res.json();
    router.push(`/test/${t.id}`);
  };

  const deleteTest = async (id: string) => {
    if (!confirm("Delete this test and all its results?")) return;
    await fetch(`/api/tests/${id}`, { method: "DELETE" });
    setTests(ts => ts.filter(t => t.id !== id));
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Spinner /></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: "1.5rem", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>My tests</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              {tests.length} test{tests.length !== 1 ? "s" : ""} in your account
            </p>
          </div>
          <Btn variant="primary" onClick={createTest}>＋ New test</Btn>
        </div>

        {tests.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>No tests yet. Create your first test to get started.</p>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tests.map(t => (
              <Card key={t.id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: t.status === "PUBLISHED" ? "#EEF2FF" : "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {t.status === "PUBLISHED" ? "🟢" : "🔵"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{t.title}</span>
                    <Badge color={t.status === "PUBLISHED" ? "success" : "default"}>
                      {t.status === "PUBLISHED" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 16 }}>
                    <span>📋 {t.questions.length} question{t.questions.length !== 1 ? "s" : ""}</span>
                    <span>⏱ {t.timeLimit ? `${t.timeLimit} min` : "No limit"}</span>
                    <span>👥 {t._count.attempts} result{t._count.attempts !== 1 ? "s" : ""}</span>
                    {t.passcode && <span>🔑 {t.passcode}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {t.status === "PUBLISHED" && (
                    <Link href={`/take/${t.id}`} target="_blank">
                      <Btn size="sm">Take test</Btn>
                    </Link>
                  )}
                  <Link href={`/test/${t.id}`}>
                    <Btn size="sm" variant="primary">Edit</Btn>
                  </Link>
                  <Btn size="sm" variant="danger" onClick={() => deleteTest(t.id)}>Delete</Btn>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
