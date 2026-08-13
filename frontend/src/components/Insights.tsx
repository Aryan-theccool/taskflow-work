import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { ColumnStat, PriorityTask } from '../types';
import { relativeTime } from '../utils/time';
import { gsap } from '../gsapSetup';

// Mirrors of the real SQL in backend/src/queries/ — shown for transparency.
const SQL_TASKS_PER_COLUMN = `SELECT c.id        AS column_id,
       c.name      AS column_name,
       COUNT(t.id) AS task_count
FROM   columns c
LEFT JOIN tasks t ON t.column_id = c.id
WHERE  c.board_id = ?
GROUP  BY c.id
ORDER  BY c.position ASC;`;

const SQL_TASKS_BY_PRIORITY = `SELECT t.*, c.name AS column_name
FROM   tasks t
JOIN   columns c ON c.id = t.column_id
WHERE  c.board_id = ? AND t.priority = ?
ORDER  BY t.created_at DESC;`;

export default function Insights({ version }: { version: number }) {
  const [stats, setStats] = useState<ColumnStat[] | null>(null);
  const [highTasks, setHighTasks] = useState<PriorityTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const animated = useRef(false);

  const load = useCallback(async (spin = false) => {
    if (spin) setRefreshing(true);
    setError(null);
    try {
      const [s, h] = await Promise.all([
        api.getBoardStats(),
        api.getTasksByPriority('High'),
      ]);
      setStats(s);
      setHighTasks(h);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      if (spin) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  // Animate the bars on first scroll into view; on later data changes, glide
  // to the new widths without flashing back to zero.
  useEffect(() => {
    if (!stats || !rootRef.current) return;
    const max = Math.max(1, ...stats.map((s) => s.task_count));
    const firstRun = !animated.current;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.insight-bar__fill').forEach((el, i) => {
        const pct = (stats[i].task_count / max) * 100;
        if (firstRun) {
          gsap.fromTo(el, { width: '0%' }, {
            width: `${pct}%`,
            duration: 1.1,
            ease: 'power4.out',
            scrollTrigger: { trigger: rootRef.current, start: 'top 82%', once: true },
          });
        } else {
          gsap.to(el, { width: `${pct}%`, duration: 0.6, ease: 'power4.out' });
        }
      });
    }, rootRef);
    animated.current = true;
    return () => ctx.revert();
  }, [stats]);

  return (
    <section className="insights" id="insights" ref={rootRef}>
      <div className="section-shell">
        <header className="board-head">
          <p className="section-eyebrow">Insights</p>
          <h2 className="section-title">Real SQL, live results.</h2>
          <p className="section-sub">
            These two panels are rendered straight from the two non-trivial queries in
            <code> backend/src/queries/</code> — the database filters and counts, not the browser.
          </p>
        </header>

        {error && (
          <div className="insights__error" role="alert">
            <p>Couldn't reach the metrics endpoint — {error}</p>
            <button className="btn btn--ghost" onClick={() => void load(true)}>
              Retry
            </button>
          </div>
        )}

        <div className="insights__grid">
          <div className="panel">
            <div className="panel__head">
              <h3>Tasks per column</h3>
              <button
                className="panel__refresh"
                onClick={() => void load(true)}
                aria-label="Refresh insights"
                disabled={refreshing}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className={refreshing ? 'is-spinning' : ''}
                >
                  <path
                    d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div className="insight-bars">
              {(stats ?? []).map((s, i) => (
                <div className="insight-bar" key={s.column_id}>
                  <span className={`insight-bar__label insight-bar__label--${i % 3}`}>
                    {s.column_name}
                  </span>
                  <div className="insight-bar__track">
                    <div className={`insight-bar__fill insight-bar__fill--${i % 3}`} />
                  </div>
                  <span className="insight-bar__value">{s.task_count}</span>
                </div>
              ))}
              {!stats && !error && <p className="panel__loading">Querying the database…</p>}
            </div>
            <pre className="sql-block" aria-label="SQL used for tasks per column">
              <code>{SQL_TASKS_PER_COLUMN}</code>
            </pre>
          </div>

          <div className="panel">
            <div className="panel__head">
              <h3>High priority, newest first</h3>
              <span className="panel__badge">{highTasks?.length ?? '–'} tasks</span>
            </div>
            <ul className="insight-list">
              {(highTasks ?? []).slice(0, 6).map((t) => (
                <li key={t.id} className="insight-list__item">
                  <span className="tag__dot tag__dot--high" aria-hidden="true" />
                  <div>
                    <p>{t.title}</p>
                    <span>
                      {t.column_name} · {relativeTime(t.created_at)}
                    </span>
                  </div>
                </li>
              ))}
              {highTasks && highTasks.length === 0 && (
                <li className="insight-list__empty">No high-priority tasks. Nice.</li>
              )}
              {!highTasks && !error && <li className="panel__loading">Querying the database…</li>}
            </ul>
            <pre className="sql-block" aria-label="SQL used for tasks by priority">
              <code>{SQL_TASKS_BY_PRIORITY}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
