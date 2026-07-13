import { QUADRANTS, CONTEXT_BY_ID, EMOTION_BY_WORD } from "../lib/emotions";
import { buildInsights, summarize, dailyTrend, topWords } from "../lib/insights";
import type { Entry } from "../lib/store";

export function Insights({ entries }: { entries: Entry[] }) {
  const s = summarize(entries);
  const insights = buildInsights(entries);
  const trend = dailyTrend(entries, 14);
  const words = topWords(entries, 8);

  return (
    <div className="insights">
      {/* Granularity is shown as a headline number because it IS the score that
          matters — not "days logged", which measures compliance, not growth. */}
      <div className="stats">
        <div className="stat">
          <div className="n">{s.total}</div>
          <div className="l">catatan</div>
        </div>
        <div className="stat">
          <div className="n">{s.distinctWords}</div>
          <div className="l">kata berbeda</div>
        </div>
        <div className="stat">
          <div className="n">{s.total ? s.avgIntensity.toFixed(1) : "—"}</div>
          <div className="l">rata-rata kuat</div>
        </div>
      </div>

      {/* 14-day valence trend */}
      {entries.length > 0 && (
        <div className="card">
          <div className="card-t">14 hari terakhir</div>
          <div className="trend">
            {trend.map((d) => {
              if (d.valence === null) {
                return <div key={d.date} className="bar empty" title={`${d.label} — kosong`} />;
              }
              // valence -1..1 → 0..100% height, centred visually on the zero line
              const h = Math.abs(d.valence) * 50;
              const up = d.valence >= 0;
              return (
                <div key={d.date} className="bar" title={`${d.label} — ${d.count} catatan`}>
                  <div className="bar-half top">
                    {up && (
                      <span
                        style={{ height: `${h * 2}%`, background: QUADRANTS.green.color }}
                      />
                    )}
                  </div>
                  <div className="bar-half bottom">
                    {!up && (
                      <span style={{ height: `${h * 2}%`, background: QUADRANTS.blue.color }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="trend-legend">
            <span>← 14 hari lalu</span>
            <span>hari ini →</span>
          </div>
        </div>
      )}

      {/* zone split */}
      {entries.length > 0 && (
        <div className="card">
          <div className="card-t">Zona</div>
          <div className="zones">
            {(["yellow", "green", "red", "blue"] as const).map((q) => {
              const n = s.byQuadrant[q];
              const p = s.total ? Math.round((n / s.total) * 100) : 0;
              return (
                <div key={q} className="zone">
                  <div className="zone-bar">
                    <span style={{ width: `${p}%`, background: QUADRANTS[q].color }} />
                  </div>
                  <div className="zone-l">
                    <b style={{ color: QUADRANTS[q].ink }}>{QUADRANTS[q].label}</b>
                    <span>{p}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* the findings */}
      {insights.map((i, idx) => (
        <div key={idx} className={`card insight ${i.kind}`}>
          <div className="ins-t">{i.title}</div>
          <p>{i.detail}</p>
        </div>
      ))}

      {/* vocabulary — makes granularity visible & nudges toward new words */}
      {words.length > 0 && (
        <div className="card">
          <div className="card-t">Kata yang paling sering kamu pakai</div>
          <div className="wordcloud">
            {words.map((w) => {
              const q = QUADRANTS[w.quadrant];
              return (
                <span
                  key={w.word}
                  className="wc"
                  style={{ background: q.soft, color: q.ink }}
                  title={EMOTION_BY_WORD[w.word]?.nuance}
                >
                  {w.word} <b>{w.count}</b>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function History({
  entries,
  onTalk,
  onDelete,
  aiOn,
}: {
  entries: Entry[];
  onTalk: (e: Entry) => void;
  onDelete: (id: string) => void;
  aiOn: boolean;
}) {
  if (entries.length === 0) {
    return <p className="muted pad">Belum ada catatan. Mulai dari tombol di bawah.</p>;
  }

  return (
    <div className="history">
      {entries.map((e) => {
        const q = QUADRANTS[e.quadrant];
        const d = new Date(e.at);
        return (
          <div key={e.id} className="hist" style={{ borderLeftColor: q.color }}>
            <div className="hist-top">
              <b style={{ color: q.ink }}>{e.word}</b>
              <span className="int" style={{ background: q.soft, color: q.ink }}>
                {e.intensity}/10
              </span>
              <span className="when">
                {d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} ·{" "}
                {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {e.contexts.length > 0 && (
              <div className="hist-tags">
                {e.contexts.map((c) => (
                  <span key={c}>
                    {CONTEXT_BY_ID[c]?.emoji} {CONTEXT_BY_ID[c]?.label ?? c}
                  </span>
                ))}
              </div>
            )}

            {e.note && <p className="hist-note">{e.note}</p>}

            <div className="hist-act">
              {aiOn && (
                <button onClick={() => onTalk(e)}>💬 Ceritain ini</button>
              )}
              <button className="del" onClick={() => onDelete(e.id)}>
                Hapus
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
