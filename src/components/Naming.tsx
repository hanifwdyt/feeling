import { useState } from "react";
import { EMOTIONS_BY_QUADRANT, QUADRANTS, type QuadrantId } from "../lib/emotions";
import { Soft } from "./Soft";

/**
 * Naming — the granularity step, moved to AFTER the unburdening.
 *
 * This is the single most important UX change in the app. Naming a feeling
 * precisely is the therapeutic act — that hasn't changed. What changed is WHEN
 * we ask for it.
 *
 * Asking a tired person to name what they feel BEFORE they've spoken is both
 * unkind and ineffective: most people don't know what they feel until they've
 * said it out loud. So we let them talk first, and only then — gently, once —
 * offer the word. It's an invitation, never a gate. It can always be skipped.
 */
export function Naming({
  onPick,
  onSkip,
}: {
  onPick: (word: string, quadrant: QuadrantId, intensity: number) => void;
  onSkip: () => void;
}) {
  const [picked, setPicked] = useState<{ word: string; q: QuadrantId } | null>(null);
  const [intensity, setIntensity] = useState(5);

  if (picked) {
    return (
      <div className="naming">
        <p className="naming-q">
          Seberapa berat rasa{" "}
          <em style={{ color: `var(--f-${picked.q}-ink)` }}>{picked.word}</em>-nya?
        </p>

        <div className="weights">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <Soft key={n}
              className={`weight ${intensity === n ? "on" : ""}`}
              style={
                intensity === n
                  ? {
                      background: `var(--f-${picked.q})`,
                      boxShadow: `0 4px 0 var(--f-${picked.q}-base), var(--lift-1)`,
                      color: `var(--f-${picked.q}-ink)`,
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
            onClick={() => onPick(picked.word, picked.q, intensity)}
          >
            Simpan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="naming">
      <p className="naming-q">Kalau harus satu kata — yang mana?</p>
      <p className="naming-sub">
        Nggak usah yang paling tepat. Yang paling dekat aja. Boleh dilewat juga.
      </p>

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
                onClick={() => setPicked({ word: e.word, q })}
              >
                {e.word}
              </Soft>
            ))}
          </div>
        </div>
      ))}

      <button className="soft-btn ghost wide" data-soft onClick={onSkip}>
        Lewati — cukup cerita aja
      </button>
    </div>
  );
}
