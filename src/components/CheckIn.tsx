import { useState } from "react";
import {
  CONTEXTS,
  EMOTIONS_BY_QUADRANT,
  QUADRANTS,
  type QuadrantId,
} from "../lib/emotions";
import { Soft } from "./Soft";

/**
 * Quick log — the SECONDARY door.
 *
 * The primary way into this app is the sofa: you talk, and the naming comes
 * afterwards. This path exists for the smaller case where someone already knows
 * exactly what they feel and just wants it written down.
 *
 * Which means it has one job: BE FAST. It used to be a four-step coordinate plot,
 * which was a lovely idea and completely wrong — a door labelled "quick" that
 * takes four steps is a door that lies. Now: pick the word, press a weight, done.
 * Tags and notes are optional and sit below the save button, not in front of it.
 */
export interface Draft {
  x: number;
  y: number;
  quadrant: QuadrantId;
  word: string;
  intensity: number;
  contexts: string[];
  note: string;
}

/** The plot coordinates are derived from the quadrant — the user never sees them. */
const coordsFor = (q: QuadrantId) => ({
  x: q === "red" || q === "blue" ? -0.5 : 0.5,
  y: q === "red" || q === "yellow" ? 0.5 : -0.5,
});

export function CheckIn({
  onSave,
  onCancel,
}: {
  onSave: (d: Draft) => void;
  onCancel: () => void;
}) {
  const [picked, setPicked] = useState<{ word: string; nuance: string; q: QuadrantId } | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [contexts, setContexts] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [more, setMore] = useState(false);

  return (
    <div className="room">
      <header className="head">
        <button className="sofa-x" data-soft onClick={onCancel}>
          ← Balik
        </button>
      </header>

      <main className="home">
        {!picked ? (
          <>
            <h1 className="quick-h">Lagi ngerasa apa?</h1>
            <p className="quick-sub">Pilih yang paling dekat. Nggak usah yang paling tepat.</p>

            {(["red", "blue", "yellow", "green"] as QuadrantId[]).map((q) => (
              <div className="wordset" key={q}>
                <span className="wordset-l" style={{ color: `var(--f-${q}-ink)` }}>
                  {QUADRANTS[q].label}
                </span>
                <div className="pillows">
                  {EMOTIONS_BY_QUADRANT[q].map((e) => (
                    <Soft key={e.word}
                      className="pillow"
                      style={{
                        background: `var(--f-${q})`,
                        color: `var(--f-${q}-ink)`,
                        ["--pillow-base" as string]: `var(--f-${q}-base)`,
                      }}
                      title={e.nuance}
                      onClick={() => setPicked({ word: e.word, nuance: e.nuance, q })}
                    >
                      {e.word}
                    </Soft>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <h1 className="quick-h">
              Seberapa berat{" "}
              <em style={{ color: `var(--f-${picked.q}-ink)`, fontStyle: "italic" }}>
                {picked.word}
              </em>
              -nya?
            </h1>
            <p className="quick-sub">{picked.nuance}.</p>

            <div className="weights">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <Soft key={n}
                  className="weight"
                  style={
                    intensity === n
                      ? {
                          background: `var(--f-${picked.q})`,
                          color: `var(--f-${picked.q}-ink)`,
                          boxShadow: `0 3px 0 -1px var(--f-${picked.q}-base)`,
                        }
                      : undefined
                  }
                  onClick={() => setIntensity(n)}
                  aria-label={`Berat ${n} dari 10`}
                >
                  {n}
                </Soft>
              ))}
            </div>

            <div className="naming-act">
              <button className="soft-btn ghost" data-soft onClick={() => setPicked(null)}>
                Ganti kata
              </button>
              <button
                className="soft-btn"
                data-soft
                onClick={() =>
                  onSave({
                    ...coordsFor(picked.q),
                    quadrant: picked.q,
                    word: picked.word,
                    intensity,
                    contexts,
                    note: note.trim(),
                  })
                }
              >
                Simpan
              </button>
            </div>

            {/* Optional, and BELOW the save button on purpose — nobody should have
                to scroll past homework to finish. */}
            {!more ? (
              <button className="quick" data-soft onClick={() => setMore(true)}>
                + tambahin konteks / catatan <b>(opsional)</b>
              </button>
            ) : (
              <div className="extra">
                <span className="wordset-l">Berkaitan dengan</span>
                <div className="pillows">
                  {CONTEXTS.map((c) => {
                    const on = contexts.includes(c.id);
                    return (
                      <Soft key={c.id}
                        className={`ctx ${on ? "on" : ""}`}
                        aria-pressed={on}
                        onClick={() =>
                          setContexts((cur) =>
                            cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id]
                          )
                        }
                      >
                        {c.label}
                      </Soft>
                    );
                  })}
                </div>

                <textarea
                  className="note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Mau nulis sesuatu?"
                  aria-label="Catatan"
                  data-soft
                />
                <p className="hint">
                  Kalau nulis, coba pisahin <b>apa yang kamu rasain</b> dari <b>apa yang kamu
                  pikirin</b>. “Aku merasa dikhianati” itu tafsiran; rasanya mungkin <i>sakit
                  hati</i> dan <i>marah</i>.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
