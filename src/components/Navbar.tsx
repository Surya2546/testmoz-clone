// src/components/Navbar.tsx
"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Btn } from "./ui";

export default function Navbar() {
  const { data: session } = useSession();
  return (
    <nav style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "10px 1.5rem",
      borderBottom: "0.5px solid var(--border)",
      background: "var(--bg)",
      position: "sticky", top: 0, zIndex: 10,
    }}>
      <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, background: "#4F46E5", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📋</div>
        <span style={{ fontSize: 15, fontWeight: 500 }}>TestMoz</span>
      </Link>
      <div style={{ flex: 1 }} />
      {session ? (
        <>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{session.user.email}</span>
          <Btn size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</Btn>
        </>
      ) : (
        <Link href="/login"><Btn size="sm">Sign in</Btn></Link>
      )}
    </nav>
  );
}
