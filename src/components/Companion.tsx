import { useEffect, useRef, useState } from "react";
import { QUADRANTS, type QuadrantId } from "../lib/emotions";
import type { Entry } from "../lib/store";
import type { Persona } from "../lib/persona";

interface Msg {
  role: "user" | "assistant";
  content: string;
  crisis?: boolean;
}

const inkVar = (q: QuadrantId) => `var(--q-${q}-ink)`;
const markVar = (q: QuadrantId) => `var(--q-${q})`;

/**
 * PRIVACY — the one place data leaves the device.
 *
 * The journal is local-only; this panel is the single exception, and it is
 * opt-in with an explicit disclosure. We send exactly ONE entry — the one the
 * user opened this on — plus what they type here. Never the history.
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
        { role: "assistant", content: e instanceof Error ? `(${e.message})` : "(gagal)" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!ack) {
    return (
      <div className="companion">
        <div className="cmp-head">
          <span className="cmp-who">Sebelum mulai</span>
          <button className="cmp-x" onClick={onClose}>
            Tutup
          </button>
        </div>
        <div className="privacy">
          <h3>Yang ini keluar dari perangkatmu.</h3>
          <p>
            Jurnalmu disimpan <b>hanya di sini</b> — tidak pernah dikirim ke mana pun. Tapi kalau
            kamu bicara dengan {persona.name}, isi percakapan itu <b>dikirim ke server AI</b> supaya
            bisa dijawab.
          </p>
          <p>
            Yang dikirim hanya <b>catatan yang sedang kamu buka ini</b> dan apa yang kamu ketik.
            Riwayat jurnalmu yang lain <b>tidak ikut</b>.
          </p>
          <p className="fine">
            Kalau kamu tidak nyaman, tidak apa-apa — tutup saja. Sisa aplikasinya tetap jalan penuh
            tanpa ini.
          </p>
          <div className="privacy-act">
            <button className="btn ghost" onClick={onClose}>
              Tidak dulu
            </button>
            <button
              className="btn"
              onClick={() => {
                localStorage.setItem("feeling:ai-ack", "1");
                setAck(true);
              }}
            >
              Aku mengerti
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="companion">
      <div className="cmp-head">
        <span className="cmp-who">
          {persona.name}
          <em className="cmp-tag">AI · bukan psikolog</em>
        </span>
        <button className="cmp-x" onClick={onClose}>
          Tutup
        </button>
      </div>

      <div
        className="cmp-ctx"
        style={{
          ["--ctx-ink" as string]: markVar(entry.quadrant),
          color: "var(--ink-3)",
        }}
      >
        membahas <b style={{ color: inkVar(entry.quadrant) }}>{entry.word}</b> ·{" "}
        {String(entry.intensity).padStart(2, "0")}/10 · {QUADRANTS[entry.quadrant].label}
      </div>

      <div className="cmp-body">
        {msgs.length === 0 && (
          <div className="starters">
            {[
              "Aku cuma mau cerita, tidak usah dikasih solusi.",
              "Kenapa ya aku bisa merasa begini?",
              "Bantu aku berpikir, aku bingung.",
            ].map((s) => (
              <button key={s} className="starter" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role} ${m.crisis ? "crisis" : ""}`}>
            {m.content.split("\n").map((line, j) => (
              <p key={j}>{bold(line)}</p>
            ))}
          </div>
        ))}

        {busy && <div className="msg assistant typing">···</div>}
        <div ref={endRef} />
      </div>

      <div className="cmp-in">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim() && !busy) send(input.trim());
          }}
          placeholder={`Cerita ke ${persona.name}…`}
          disabled={busy}
          aria-label="Pesan"
        />
        <button disabled={!input.trim() || busy} onClick={() => send(input.trim())}>
          Kirim
        </button>
      </div>
    </div>
  );
}

/** Minimal **bold** — the crisis message uses it for the phone numbers. */
function bold(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>
  );
}
