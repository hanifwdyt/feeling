import { useRef, useState } from "react";
import {
  CONTEXTS,
  EMOTIONS_BY_QUADRANT,
  QUADRANTS,
  quadrantAt,
  type Emotion,
  type QuadrantId,
} from "../lib/emotions";

/**
 * The check-in.
 *
 * Designed around one constraint above all others: THIS MUST TAKE UNDER 20
 * SECONDS. Every mood tracker dies the same death — it becomes homework, the
 * user starts tapping whatever is fastest, and the data turns into fiction.
 * So: 4 steps, each one tap, and the last two are skippable.
 *
 * The order matters and is not arbitrary. You place yourself on the grid BEFORE
 * seeing any words, because being handed a vocabulary first anchors you to it —
 * you pick the word you recognise rather than the one that's true. Body first,
 * language second.
 */

type Step = "grid" | "word" | "intensity" | "why";

export interface Draft {
  x: number;
  y: number;
  quadrant: QuadrantId;
  word: string;
  intensity: number;
  contexts: string[];
  note: string;
}

export function CheckIn({
  onSave,
  onCancel,
}: {
  onSave: (d: Draft) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>("grid");
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [word, setWord] = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [contexts, setContexts] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  const quadrant: QuadrantId | null = pos ? quadrantAt(pos.x, pos.y) : null;

  const pickPoint = (e: React.PointerEvent) => {
    const el = gridRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // x: left→right = unpleasant→pleasant. y: SCREEN top→bottom is high→low
    // energy, so it flips sign.
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    setPos({ x: clamp(x), y: clamp(y) });
    setStep("word");
  };

  return (
    <div className="checkin">
      <div className="ci-head">
        <button className="ci-back" onClick={step === "grid" ? onCancel : () => back(step, setStep)}>
          ←
        </button>
        <div className="ci-steps">
          {(["grid", "word", "intensity", "why"] as Step[]).map((s) => (
            <span key={s} className={`ci-dot ${s === step ? "on" : ""}`} />
          ))}
        </div>
      </div>

      {/* ── 1. body first: where are you? ─────────────────────────────────── */}
      {step === "grid" && (
        <div className="ci-panel">
          <h2>Lagi di mana rasamu?</h2>
          <p className="ci-sub">
            Belum usah cari kata. Rasain aja badanmu — lagi bertenaga atau lemes, enak atau
            nggak enak.
          </p>

          <div className="grid-wrap">
            <span className="axis top">energi tinggi</span>
            <span className="axis bottom">energi rendah</span>
            <span className="axis left">nggak enak</span>
            <span className="axis right">enak</span>

            <div className="grid" ref={gridRef} onPointerDown={pickPoint}>
              {(["red", "yellow", "blue", "green"] as QuadrantId[]).map((q) => (
                <div key={q} className={`cell ${q}`} style={{ background: QUADRANTS[q].soft }}>
                  <span style={{ color: QUADRANTS[q].ink }}>{QUADRANTS[q].label}</span>
                </div>
              ))}
              {pos && (
                <span
                  className="pin"
                  style={{
                    left: `${((pos.x + 1) / 2) * 100}%`,
                    top: `${((1 - pos.y) / 2) * 100}%`,
                    background: QUADRANTS[quadrantAt(pos.x, pos.y)].color,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. now the language ───────────────────────────────────────────── */}
      {step === "word" && quadrant && (
        <div className="ci-panel">
          <h2>Yang mana yang paling pas?</h2>
          <p className="ci-sub">
            Kalau ragu di antara dua, baca keterangan kecilnya — bedanya biasanya di situ.
          </p>

          <div className="words">
            {EMOTIONS_BY_QUADRANT[quadrant].map((e) => (
              <button
                key={e.word}
                className={`wordbtn ${word?.word === e.word ? "on" : ""}`}
                style={
                  word?.word === e.word
                    ? { borderColor: QUADRANTS[quadrant].color, background: QUADRANTS[quadrant].soft }
                    : undefined
                }
                onClick={() => {
                  setWord(e);
                  setStep("intensity");
                }}
              >
                <span className="w">{e.word}</span>
                <span className="n">{e.nuance}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. how strong ─────────────────────────────────────────────────── */}
      {step === "intensity" && word && quadrant && (
        <div className="ci-panel">
          <h2>
            Seberapa kuat rasa <b style={{ color: QUADRANTS[quadrant].ink }}>{word.word}</b>-nya?
          </h2>
          <p className="ci-sub">{word.nuance}.</p>

          <div className="intensity">
            <div className="int-val" style={{ color: QUADRANTS[quadrant].ink }}>
              {intensity}
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              style={{ accentColor: QUADRANTS[quadrant].color }}
            />
            <div className="int-ends">
              <span>samar</span>
              <span>menguasai</span>
            </div>
          </div>

          <button className="btn primary" onClick={() => setStep("why")}>
            Lanjut
          </button>
        </div>
      )}

      {/* ── 4. the "why" — tags do the work, the note is optional ─────────── */}
      {step === "why" && word && quadrant && (
        <div className="ci-panel">
          <h2>Ada hubungannya sama apa?</h2>
          <p className="ci-sub">
            Boleh lebih dari satu, boleh juga dilewat. Tag inilah yang nanti bikin polanya
            kelihatan.
          </p>

          <div className="tags">
            {CONTEXTS.map((c) => {
              const on = contexts.includes(c.id);
              return (
                <button
                  key={c.id}
                  className={`tag ${on ? "on" : ""}`}
                  style={on ? { borderColor: QUADRANTS[quadrant].color, background: QUADRANTS[quadrant].soft } : undefined}
                  onClick={() =>
                    setContexts((cur) =>
                      cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id]
                    )
                  }
                >
                  <span>{c.emoji}</span> {c.label}
                </button>
              );
            })}
          </div>

          <textarea
            className="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Mau nulis sesuatu? (boleh dikosongin)"
          />
          {/* The one piece of coaching in the whole flow — and the one that
              actually separates feeling from story. */}
          <p className="ci-tip">
            Kalau nulis, coba pisahkan <b>apa yang kamu rasakan</b> dari <b>apa yang kamu
            pikirkan</b>. "Aku merasa dikhianati" itu tafsiran; rasanya mungkin{" "}
            <i>sakit hati</i> dan <i>marah</i>.
          </p>

          <button
            className="btn primary"
            onClick={() =>
              pos &&
              onSave({
                x: pos.x,
                y: pos.y,
                quadrant,
                word: word.word,
                intensity,
                contexts,
                note: note.trim(),
              })
            }
          >
            Simpan
          </button>
        </div>
      )}
    </div>
  );
}

const clamp = (n: number): number => Math.max(-1, Math.min(1, n));

function back(step: Step, setStep: (s: Step) => void) {
  const order: Step[] = ["grid", "word", "intensity", "why"];
  const i = order.indexOf(step);
  setStep(order[Math.max(0, i - 1)]);
}
