// src/app/login/page.tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Btn, Input, Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error); setLoading(false); return; }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { setError("Invalid email or password"); setLoading(false); return; }
      router.push("/dashboard");
    } catch { setError("Something went wrong"); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", padding: "1rem" }}>
      <Card style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#4F46E5", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 12px" }}>📋</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>TestMoz</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>{mode === "login" ? "Sign in to your account" : "Create a new account"}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Name</label>
              <Input value={name} onChange={setName} placeholder="Your name" />
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Email</label>
            <Input type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Password</label>
            <Input type="password" value={password} onChange={setPassword} placeholder="••••••••" />
          </div>
          {error && <p style={{ fontSize: 12, color: "#991B1B", margin: 0, background: "#FEF2F2", padding: "6px 10px", borderRadius: "var(--radius-md)" }}>{error}</p>}
          <Btn variant="primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Btn>
        </div>

        <p style={{ fontSize: 12, textAlign: "center", marginTop: 16, color: "var(--text-secondary)" }}>
          {mode === "login" ? "No account? " : "Already have one? "}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{ color: "#4F46E5", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </Card>
    </div>
  );
}
