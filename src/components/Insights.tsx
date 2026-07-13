import { QUADRANTS, CONTEXT_BY_ID, type QuadrantId } from "../lib/emotions";
import { buildInsights, summarize, dailyTrend, topWords } from "../lib/insights";
import type { Entry } from "../lib/store";

/** Quadrant colour, always via token — never an inline value. */
const inkVar = (q: QuadrantId) => `var(--f-${q}-ink)`;
const markVar = (q: QuadrantId) => `var(--f-${q})`;
const baseVar = (q: QuadrantId) => `var(--f-${q}-base)`;

/**
 * The pattern sheet — a chart, not a dashboard.
 *
 * Note what is NOT here: no streak, no score, no "you're doing great!". The one
 * headline figure is DISTINCT WORDS, because that is the measure that actually
 * tracks emotional intelligence. "Days logged" would measure compliance, and
 * measuring compliance is how these apps start lying to you.
 */
export function Insights({ entries }: { entries: Entry[] }) {
  const s = summarize(entries);
  const findings = buildInsights(entries);
  const trend = dailyTrend(entries, 14);
  const words = topWords(entries, 10);

  return (
    <div>
      <div className="card">
        <div className="figures">
          <div className="figure">
            <div className="n">{s.total}</div>
            <div className="l">catatan</div>
          </div>
          <div className="figure">
            <div className="n">{s.distinctWords}</div>
            <div className="l">kata berbeda</div>
          </div>
          <div className="figure">
            <div className="n">{s.total ? s.avgIntensity.toFixed(1) : "—"}</div>
            <div className="l">rata-rata kuat</div>
          </div>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="card">
          <h2 className="block-t">Rasa · 14 hari</h2>
          <div className="strip">
            {trend.map((d) => {
              if (d.valence === null) {
                return <div key={d.date} className="col void" title={`${d.label} — kosong`} />;
              }
              const h = Math.abs(d.valence) * 100;
              const up = d.valence >= 0;
              return (
                <div key={d.date} className="col" title={`${d.label} · ${d.count} catatan`}>
                  <div className="col-half up">
                    {up && <span style={{ height: `${h}%`, background: markVar("green") }} />}
                  </div>
                  <div className="col-half">
                    {!up && <span style={{ height: `${h}%`, background: markVar("blue") }} />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="strip-x">
            <span>2 minggu lalu</span>
            <span>hari ini</span>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="card">
          <h2 className="block-t">Sebaran zona</h2>
          <div className="dist">
            {(["yellow", "green", "red", "blue"] as QuadrantId[]).map((q) => {
              const n = s.byQuadrant[q];
              const p = s.total ? Math.round((n / s.total) * 100) : 0;
              return (
                <div key={q} className="dist-row">
                  <span className="dist-l" style={{ color: inkVar(q) }}>
                    {QUADRANTS[q].label}
                  </span>
                  <span className="dist-bar">
                    <span style={{ width: `${p}%`, background: markVar(q) }} />
                  </span>
                  <span className="dist-p">{p}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {findings.map((f, i) => (
        <div key={i} className="finding">
          <div className="finding-t">{f.title}</div>
          <p>{f.detail}</p>
        </div>
      ))}

      {words.length > 0 && (
        <div className="card">
          <h2 className="block-t">Kata yang kamu pakai</h2>
          <div className="lexicon-used">
            {words.map((w) => (
              <span
                key={w.word}
                className="lu"
                style={{
                  background: markVar(w.quadrant),
                  color: inkVar(w.quadrant),
                  ["--lu-base" as string]: baseVar(w.quadrant),
                }}
              >
                {w.word}
                <span className="lu-n">{w.count}</span>
              </span>
            ))}
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
    return (
      <p className="empty">
        Belum ada apa-apa di sini. Mulai kapan pun kamu siap.
      </p>
    );
  }

  return (
    <div className="entries">
      {entries.map((e) => {
        const d = new Date(e.at);
        return (
          <article
            key={e.id}
            className="entry"
            style={{
              ["--entry-tint" as string]: markVar(e.quadrant),
              ["--entry-base" as string]: baseVar(e.quadrant),
            }}
          >
            <div className="entry-h">
              <span className="entry-w" style={{ color: inkVar(e.quadrant) }}>
                {e.word}
              </span>
              <span className="entry-i">{e.intensity}/10</span>
              <span className="entry-t">
                {d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}{" "}
                {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {e.contexts.length > 0 && (
              <div className="entry-tags">
                {e.contexts.map((c) => (
                  <span key={c}>{CONTEXT_BY_ID[c]?.label ?? c}</span>
                ))}
              </div>
            )}

            {e.note && <p className="entry-note">{e.note}</p>}

            <div className="entry-act">
              {aiOn && <button onClick={() => onTalk(e)}>Ceritain ini</button>}
              <button className="del" onClick={() => onDelete(e.id)}>
                Hapus
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
