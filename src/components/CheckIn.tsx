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
 * The check-in — a plot, not a picker.
 *
 * Design position: this app is an INSTRUMENT, not a wellness product. The user
 * locates themselves on a coordinate plane; the interface reads out where they
 * are, in numbers, the way any honest instrument does. Nothing here soothes,
 * because soothing an angry person is a way of not listening to them.
 *
 * The step order is load-bearing and must not be reversed: you place yourself
 * on the plane BEFORE any vocabulary appears. Handed a word list first, people
 * pick the word they recognise instead of the word that's true. Body first,
 * language second.
 */

type Step = "plot" | "word" | "dial" | "why";
const STEPS: Step[] = ["plot", "word", "dial", "why"];

export interface Draft {
  x: number;
  y: number;
  quadrant: QuadrantId;
  word: string;
  intensity: number;
  contexts: string[];
  note: string;
}

/** Per-quadrant ink, as a CSS custom property — never an inline colour value. */
const inkVar = (q: QuadrantId) => `var(--q-${q}-ink)`;
const markVar = (q: QuadrantId) => `var(--q-${q})`;

export function CheckIn({
  onSave,
  onCancel,
}: {
  onSave: (d: Draft) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>("plot");
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [word, setWord] = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [contexts, setContexts] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const plotRef = useRef<HTMLDivElement>(null);

  const quadrant: QuadrantId | null = pos ? quadrantAt(pos.x, pos.y) : null;
  const live = hover ?? pos;

  const toWorld = (e: React.PointerEvent) => {
    const el = plotRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    // x: unpleasant → pleasant. y flips: screen-down is LOW energy.
    const x = clamp(((e.clientX - r.left) / r.width) * 2 - 1);
    const y = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1));
    return { x, y };
  };

  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="checkin">
      <div className="ci-head">
        <button
          className="ci-back"
          onClick={step === "plot" ? onCancel : () => setStep(STEPS[Math.max(0, stepIdx - 1)])}
        >
          ← {step === "plot" ? "Batal" : "Kembali"}
        </button>
        <span className="ci-steps">
          <b>{String(stepIdx + 1).padStart(2, "0")}</b> / 04
        </span>
      </div>

      {/* ── 01 · locate yourself ────────────────────────────────────────── */}
      {step === "plot" && (
        <div className="ci-panel">
          <h2>Di mana kamu sekarang?</h2>
          <p className="ci-sub">
            Belum usah cari kata. Rasakan dulu badanmu — sedang bertenaga atau lemas, enak atau
            tidak enak. Tandai titiknya.
          </p>

          <div className="plot-wrap">
            <span className="axis-label top">energi tinggi</span>
            <span className="axis-label bottom">energi rendah</span>
            <span className="axis-label left">tidak enak</span>
            <span className="axis-label right">enak</span>

            <div
              className="plot"
              ref={plotRef}
              onPointerDown={(e) => {
                const p = toWorld(e);
                if (!p) return;
                setPos(p);
                setStep("word");
              }}
              onPointerMove={(e) => setHover(toWorld(e))}
              onPointerLeave={() => setHover(null)}
            >
              <div className="quad red">
                <span>tegang</span>
              </div>
              <div className="quad yellow">
                <span>hidup</span>
              </div>
              <div className="quad blue">
                <span>redup</span>
              </div>
              <div className="quad green">
                <span>tenang</span>
              </div>

              <div className="axis-line h" />
              <div className="axis-line v" />

              {/* the instrument tracking your hand */}
              {hover && (
                <>
                  <div className="cross h" style={{ top: `${((1 - hover.y) / 2) * 100}%` }} />
                  <div className="cross v" style={{ left: `${((hover.x + 1) / 2) * 100}%` }} />
                </>
              )}

              {pos && (
                <span
                  className="mark-pt"
                  style={{
                    left: `${((pos.x + 1) / 2) * 100}%`,
                    top: `${((1 - pos.y) / 2) * 100}%`,
                    background: markVar(quadrantAt(pos.x, pos.y)),
                  }}
                />
              )}
            </div>

            {/* the readout. An instrument tells you what it measured. */}
            <div className="readout">
              <span>
                rasa <b>{live ? fmt(live.x) : "—.——"}</b>
              </span>
              <span>
                energi <b>{live ? fmt(live.y) : "—.——"}</b>
              </span>
              <span style={live ? { color: inkVar(quadrantAt(live.x, live.y)) } : undefined}>
                {live ? QUADRANTS[quadrantAt(live.x, live.y)].label.toLowerCase() : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 02 · the lexicon ────────────────────────────────────────────── */}
      {step === "word" && quadrant && (
        <div className="ci-panel">
          <h2>Yang mana yang benar?</h2>
          <p className="ci-sub">
            Bukan yang paling dekat — yang paling <i>benar</i>. Kalau ragu antara dua, keterangan
            kecilnya yang membedakan.
          </p>

          <div className="lex">
            {EMOTIONS_BY_QUADRANT[quadrant].map((e) => (
              <button
                key={e.word}
                className="lex-row"
                onClick={() => {
                  setWord(e);
                  setStep("dial");
                }}
              >
                <span>
                  <span className="lex-w" style={{ color: inkVar(quadrant) }}>
                    {e.word}
                  </span>
                  <span className="lex-n">{e.nuance}</span>
                </span>
                <span className="lex-i">pilih →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 03 · the dial ───────────────────────────────────────────────── */}
      {step === "dial" && word && quadrant && (
        <div className="ci-panel">
          <h2>
            Seberapa kuat <em style={{ color: inkVar(quadrant), fontStyle: "italic" }}>{word.word}</em>-nya?
          </h2>
          <p className="ci-sub">{word.nuance}.</p>

          <div className="dial" style={{ ["--dial-ink" as string]: markVar(quadrant) }}>
            <div className="dial-val" style={{ color: inkVar(quadrant) }}>
              {String(intensity).padStart(2, "0")}
              <small>/ 10</small>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              aria-label={`Intensitas ${word.word}`}
            />
            <div className="dial-ticks">
              <span>samar</span>
              <span>menguasai</span>
            </div>
          </div>

          <button className="btn" onClick={() => setStep("why")}>
            Lanjut
          </button>
        </div>
      )}

      {/* ── 04 · the context ────────────────────────────────────────────── */}
      {step === "why" && word && quadrant && (
        <div className="ci-panel">
          <h2>Berkaitan dengan apa?</h2>
          <p className="ci-sub">
            Boleh lebih dari satu, boleh dilewat. Tag inilah yang nanti bikin polanya kelihatan —
            catatan bebas tidak bisa dihitung.
          </p>

          <div className="tags">
            {CONTEXTS.map((c) => {
              const on = contexts.includes(c.id);
              return (
                <button
                  key={c.id}
                  className={`tag ${on ? "on" : ""}`}
                  aria-pressed={on}
                  onClick={() =>
                    setContexts((cur) =>
                      cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id]
                    )
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <textarea
            className="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Catatan (boleh kosong)"
            aria-label="Catatan"
          />
          <p className="ci-tip">
            Kalau menulis, pisahkan <b>apa yang kamu rasakan</b> dari <b>apa yang kamu pikirkan</b>.
            “Aku merasa dikhianati” itu tafsiran; rasanya mungkin <i>sakit hati</i> dan <i>marah</i>.
          </p>

          <button
            className="btn"
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
            Catat
          </button>
        </div>
      )}
    </div>
  );
}

const clamp = (n: number): number => Math.max(-1, Math.min(1, n));

/** Signed, fixed-width — a readout should not jitter as the value crosses zero. */
const fmt = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(2);
