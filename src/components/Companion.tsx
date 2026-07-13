import { useEffect, useRef, useState } from "react";
import { QUADRANTS } from "../lib/emotions";
import type { Entry } from "../lib/store";
import type { Persona } from "../lib/persona";

interface Msg {
  role: "user" | "assistant";
  content: string;
  crisis?: boolean;
}

/**
 * The vent-to-a-friend panel.
 *
 * PRIVACY — the thing to keep straight in your head while reading this:
 * the journal is local-only, but THIS is the one place data leaves the device.
 * We send exactly one entry (the one the user opened this on) plus what they
 * type here. Never the history. The UI says so out loud the first time.
 */
export function Companion({
  entry,
  persona,
  onClose,
}: {
  entry: Entry;
  persona: Persona;
  onClose: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ack, setAck] = useState(() => localStorage.getItem("feeling:ai-ack") === "1");
  const endRef = useRef<HTMLDivElement>(null);

  const q = QUADRANTS[entry.quadrant];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          // ONE entry — not the journal.
          entry: {
            word: entry.word,
            intensity: entry.intensity,
            contexts: entry.contexts,
            note: entry.note,
          },
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "gagal");
      setMsgs([...next, { role: "assistant", content: data.message, crisis: data.crisis }]);
    } catch (e) {
      setMsgs([
        ...next,
        {
          role: "assistant",
          content: e instanceof Error ? `(${e.message})` : "(gagal menghubungi)",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  // ── The privacy gate. Shown once, and it does not soften the truth. ────────
  if (!ack) {
    return (
      <div className="companion">
        <div className="cmp-head">
          <span>Sebelum mulai</span>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="privacy">
          <h3>Yang ini keluar dari HP-mu.</h3>
          <p>
            Jurnalmu disimpan <b>cuma di perangkat ini</b> — nggak pernah dikirim ke mana-mana.
            Tapi kalau kamu ngobrol sama {persona.name}, isi obrolan itu{" "}
            <b>dikirim ke server AI (DeepSeek)</b> supaya bisa dijawab.
          </p>
          <p>
            Yang dikirim cuma <b>catatan yang lagi kamu buka ini</b> dan apa yang kamu ketik di
            sini. Riwayat jurnalmu yang lain <b>nggak ikut</b>.
          </p>
          <p className="fine">
            Kalau kamu nggak nyaman dengan itu, nggak apa-apa — tutup aja. Sisa aplikasinya tetap
            jalan penuh tanpa ini.
          </p>
          <div className="privacy-actions">
            <button className="btn ghost" onClick={onClose}>
              Nggak dulu
            </button>
            <button
              className="btn primary"
              onClick={() => {
                localStorage.setItem("feeling:ai-ack", "1");
                setAck(true);
              }}
            >
              Aku ngerti, lanjut
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="companion">
      <div className="cmp-head">
        <span>
          <b>{persona.name}</b>
          <em className="cmp-tag">AI · bukan psikolog</em>
        </span>
        <button className="x" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="cmp-ctx" style={{ background: q.soft, color: q.ink }}>
        Lagi bahas: <b>{entry.word}</b> ({entry.intensity}/10)
      </div>

      <div className="cmp-body">
        {msgs.length === 0 && (
          <div className="cmp-starters">
            <p className="muted">Mau mulai dari mana?</p>
            {[
              "Aku pengen cerita aja, nggak usah dikasih solusi.",
              "Kenapa ya aku bisa ngerasa gini?",
              "Bantu aku mikir, aku bingung.",
            ].map((s) => (
              <button key={s} className="starter" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role} ${m.crisis ? "crisis" : ""}`}>
            {m.content.split("\n").map((line, j) => (
              <p key={j}>{renderBold(line)}</p>
            ))}
          </div>
        ))}

        {busy && <div className="bubble assistant typing">…</div>}
        <div ref={endRef} />
      </div>

      <div className="cmp-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim() && !busy) send(input.trim());
          }}
          placeholder={`Cerita ke ${persona.name}…`}
          disabled={busy}
        />
        <button disabled={!input.trim() || busy} onClick={() => send(input.trim())}>
          Kirim
        </button>
      </div>
    </div>
  );
}

/** Minimal **bold** support — the crisis message uses it for the phone numbers. */
function renderBold(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>
  );
}
