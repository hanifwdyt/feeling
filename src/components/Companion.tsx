import { useEffect, useRef, useState } from "react";
import { QUADRANTS, type QuadrantId } from "../lib/emotions";
import type { Entry } from "../lib/store";
import type { Persona } from "../lib/persona";
import { Naming } from "./Naming";
import { Soft } from "./Soft";
import { motion, AnimatePresence } from "motion/react";

interface Msg {
  role: "user" | "assistant";
  content: string;
  crisis?: boolean;
}

export interface Named {
  word: string;
  quadrant: QuadrantId;
  intensity: number;
  note: string;
}

/**
 * The sofa.
 *
 * You lie down. You talk. Something listens. That is the entire primary flow,
 * and it asks nothing of you first.
 *
 * `entry` is OPTIONAL by design. When it's null the user came here to vent with
 * no structure at all — which is the common case for someone exhausted — and
 * only once they've unburdened do we offer, once, to help name it.
 *
 * PRIVACY: the journal never leaves the device; this panel is the one exception,
 * and it's opt-in with a plain-language disclosure. We send the current entry
 * (if any) and what's typed here. Never the history.
 */
export function Companion({
  entry,
  persona,
  onClose,
  onSaveNamed,
}: {
  entry: Entry | null;
  persona: Persona;
  onClose: () => void;
  onSaveNamed?: (n: Named) => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ack, setAck] = useState(() => localStorage.getItem("feeling:ai-ack") === "1");
  const [naming, setNaming] = useState(false);
  const [offered, setOffered] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy, naming]);

  const said = msgs.filter((m) => m.role === "user").length;
  // Offer the word only once they've actually unburdened. Asking too early turns
  // the sofa back into a form.
  const canOffer = !entry && !!onSaveNamed && said >= 2 && !busy && !naming && !offered;

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
          entry: entry
            ? {
                word: entry.word,
                intensity: entry.intensity,
                contexts: entry.contexts,
                note: entry.note,
              }
            : null,
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

  /** What they actually said — kept as the entry's note, in their own words. */
  const spoken = () =>
    msgs
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n\n");

  // ── the disclosure. Shown once, and it doesn't soften the truth. ──────────
  if (!ack) {
    return (
      <div className="sofa">
        <div className="sofa-top">
          <span className="sofa-who">Sebentar dulu</span>
          <button className="sofa-x" data-soft onClick={onClose}>
            Tutup
          </button>
        </div>
        <div className="disclose">
          <h3>Yang ini keluar dari perangkatmu.</h3>
          <p>
            Jurnalmu disimpan <b>cuma di sini</b> — nggak pernah dikirim ke mana-mana. Tapi kalau
            kamu cerita ke {persona.name}, isi obrolannya <b>dikirim ke server AI</b> supaya bisa
            dijawab.
          </p>
          <p>
            Yang dikirim cuma <b>obrolan ini</b>. Catatan-catatanmu yang lain <b>nggak ikut</b>.
          </p>
          <p className="fine">
            Kalau nggak nyaman, nggak apa-apa — tutup aja. Sisa aplikasinya tetap jalan penuh.
          </p>
          <div className="disclose-act">
            <button className="soft-btn ghost" data-soft onClick={onClose}>
              Nggak dulu
            </button>
            <button
              className="soft-btn"
              data-soft
              onClick={() => {
                localStorage.setItem("feeling:ai-ack", "1");
                setAck(true);
              }}
            >
              Aku ngerti
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sofa">
      <div className="sofa-top">
        <span className="sofa-who">
          {persona.name}
          <em className="sofa-tag">AI · bukan psikolog</em>
        </span>
        <button className="sofa-x" data-soft onClick={onClose}>
          Tutup
        </button>
      </div>

      {entry && (
        <div className="sofa-ctx" style={{ background: `var(--f-${entry.quadrant})` }}>
          <span style={{ color: `var(--f-${entry.quadrant}-ink)` }}>
            lagi bahas <b>{entry.word}</b> · {entry.intensity}/10 ·{" "}
            {QUADRANTS[entry.quadrant].label.toLowerCase()}
          </span>
        </div>
      )}

      <div className="sofa-body">
        {msgs.length === 0 && (
          <div className="opening">
            <p className="opening-l">
              Ngeloso aja. Nggak usah rapi, nggak usah urut.
            </p>
            <div className="openers">
              {[
                "Aku cuma mau cerita, nggak usah dikasih solusi.",
                "Hari ini berat banget.",
                "Aku nggak tau aku ngerasa apa.",
              ].map((s) => (
                <button key={s} className="opener" data-soft onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div
              key={i}
              className={`bubble ${m.role} ${m.crisis ? "crisis" : ""}`}
              initial={{ y: 10, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.8 }}
            >
              {m.content.split("\n").map((line, j) => (
                <p key={j}>{bold(line)}</p>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <div className="bubble assistant breathing" data-soft>
            <span />
            <span />
            <span />
          </div>
        )}

        {/* Offered once, quietly, only after they've said something real. */}
        {canOffer && (
          <div className="offer">
            <p>Udah agak lega? Boleh aku bantu namain yang barusan?</p>
            <div className="offer-act">
              <button className="soft-btn sm" data-soft onClick={() => setNaming(true)}>
                Boleh
              </button>
              <button
                className="soft-btn sm ghost"
                data-soft
                onClick={() => setOffered(true)}
              >
                Nanti aja
              </button>
            </div>
          </div>
        )}

        {naming && onSaveNamed && (
          <Naming
            onPick={(word, quadrant, intensity) =>
              onSaveNamed({ word, quadrant, intensity, note: spoken() })
            }
            onSkip={() => {
              setNaming(false);
              setOffered(true);
            }}
          />
        )}

        <div ref={endRef} />
      </div>

      {!naming && (
        <div className="sofa-in">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim() && !busy) send(input.trim());
            }}
            placeholder="Cerita aja…"
            disabled={busy}
            aria-label="Cerita"
            data-soft
          />
          <Soft
            disabled={!input.trim() || busy}
            onClick={() => send(input.trim())}
            aria-label="Kirim"
          >
            ↑
          </Soft>
        </div>
      )}
    </div>
  );
}

/** Minimal **bold** — the crisis message uses it for the phone numbers. */
function bold(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>
  );
}
