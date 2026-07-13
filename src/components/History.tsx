import { CONTEXT_BY_ID, type QuadrantId } from "../lib/emotions";
import type { Entry } from "../lib/store";
import { Soft } from "./Soft";

const inkVar = (q: QuadrantId) => `var(--f-${q}-ink)`;
const markVar = (q: QuadrantId) => `var(--f-${q})`;
const baseVar = (q: QuadrantId) => `var(--f-${q}-base)`;

/**
 * The ledger of what you've told it.
 *
 * Lives in its own module on purpose: it renders on the home screen, so bundling
 * it together with the pattern charts (which sit behind a tab press) would drag
 * all of that into the first paint for no reason.
 */
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
              {aiOn && <Soft onClick={() => onTalk(e)}>Ceritain ini</Soft>}
              <Soft className="del" onClick={() => onDelete(e.id)}>
                Hapus
              </Soft>
            </div>
          </article>
        );
      })}
    </div>
  );
}
