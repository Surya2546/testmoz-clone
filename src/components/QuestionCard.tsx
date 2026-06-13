// src/components/QuestionCard.tsx
"use client";
import { Btn, Badge, Input } from "./ui";

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill in the blank" },
  { value: "essay", label: "Essay" },
  { value: "short_answer", label: "Short answer" },
];

type Question = {
  id?: string; type: string; text: string; points: number;
  options: string[]; correctIndex?: number | null;
  correctBool?: boolean | null; correctText?: string | null;
  explanation?: string | null; order: number;
};

export default function QuestionCard({
  q, index, expanded, onToggle, onUpdate, onDelete,
}: {
  q: Question; index: number; expanded: boolean;
  onToggle: () => void; onUpdate: (patch: Partial<Question>) => void; onDelete: () => void;
}) {
  const typeLabel = QUESTION_TYPES.find(t => t.value === q.type)?.label || q.type;

  return (
    <div style={{ border: "0.5px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--bg)", overflow: "hidden" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", userSelect: "none" }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#EEF2FF", color: "#4F46E5", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{index + 1}</span>
        <span style={{ flex: 1, fontSize: 13, color: q.text ? "var(--text)" : "var(--text-secondary)" }}>{q.text || "Untitled question"}</span>
        <Badge color="default">{typeLabel}</Badge>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{q.points} pt</span>
        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: "0.5px solid var(--border)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Question type</label>
              <select
                value={q.type}
                onChange={e => {
                  const t = e.target.value;
                  const patch: Partial<Question> = { type: t, options: t === "multiple_choice" ? ["", "", "", ""] : [], correctIndex: null, correctBool: null, correctText: null };
                  onUpdate(patch);
                }}
                style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: "0.5px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg)", color: "var(--text)" }}
              >
                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ width: 80 }}>
              <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Points</label>
              <Input type="number" value={q.points} onChange={v => { const val = parseInt(v); onUpdate({ points: isNaN(val) ? 1 : Math.max(0, val) }); }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Question text</label>
            <textarea
              value={q.text}
              onChange={e => onUpdate({ text: e.target.value })}
              placeholder="Enter your question…"
              rows={2}
              style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "0.5px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg)", color: "var(--text)", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          {q.type === "multiple_choice" && (
            <div>
              <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Answer choices (click circle to mark correct)</label>
              {(q.options || ["", "", "", ""]).map((opt, oi) => (
                <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => onUpdate({ correctIndex: oi })}
                    style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${q.correctIndex === oi ? "#4F46E5" : "var(--border)"}`, background: q.correctIndex === oi ? "#4F46E5" : "transparent", cursor: "pointer", flexShrink: 0 }}
                  />
                  <Input
                    value={opt}
                    onChange={v => { const opts = [...(q.options || [])]; opts[oi] = v; onUpdate({ options: opts }); }}
                    placeholder={`Option ${oi + 1}`}
                  />
                </div>
              ))}
              <Btn size="sm" onClick={() => onUpdate({ options: [...(q.options || []), ""] })}>+ Add option</Btn>
            </div>
          )}

          {q.type === "true_false" && (
            <div>
              <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Correct answer</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[true, false].map(v => (
                  <button key={String(v)} type="button" onClick={() => onUpdate({ correctBool: v })}
                    style={{ flex: 1, padding: "8px", borderRadius: "var(--radius-md)", border: `0.5px solid ${q.correctBool === v ? "#4F46E5" : "var(--border)"}`, background: q.correctBool === v ? "#EEF2FF" : "var(--bg-secondary)", cursor: "pointer", fontWeight: 500, fontSize: 13, color: q.correctBool === v ? "#4F46E5" : "var(--text)" }}>
                    {v ? "True" : "False"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(q.type === "fill_blank" || q.type === "short_answer") && (
            <div>
              <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Correct answer (exact match)</label>
              <Input value={q.correctText || ""} onChange={v => onUpdate({ correctText: v })} placeholder="Expected answer…" />
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Explanation (shown after submission)</label>
            <Input value={q.explanation || ""} onChange={v => onUpdate({ explanation: v })} placeholder="Optional explanation…" />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn size="sm" variant="danger" onClick={onDelete}>Delete question</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
