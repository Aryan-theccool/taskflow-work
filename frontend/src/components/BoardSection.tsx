import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import type { Board, Priority, PriorityFilter, Task, TaskDraft } from '../types';
import { PRIORITIES } from '../types';
import { gsap, ScrollTrigger } from '../gsapSetup';
import { useToasts } from '../state/ToastContext';
import ColumnView from './ColumnView';
import TaskModal from './TaskModal';
import ErrorState from './ErrorState';

export type ModalState =
  | { mode: 'create'; columnId: number }
  | { mode: 'edit'; task: Task }
  | null;

export interface DragState {
  taskId: number;
  fromColumnId: number;
}

const BOARD_ID = 1;

export default function BoardSection({ onDataChange }: { onDataChange: () => void }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PriorityFilter>('All');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [lastTaskId, setLastTaskId] = useState<number | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const toasts = useToasts();

  const load = useCallback(async () => {
    setError(null);
    try {
      setBoard(await api.getBoard(BOARD_ID));
    } catch (err) {
      setBoard(null);
      setError(err instanceof Error ? err.message : 'Unexpected error loading the board');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Section header + columns entrance, once data exists and the section scrolls in.
  // Deferred one frame + keyed on `boardReady` (a stable boolean) so board
  // mutations don't re-trigger it and StrictMode's double-mount keeps it alive.
  const boardReady = !!board;
  useEffect(() => {
    if (!boardReady || !rootRef.current) return;
    let cancelled = false;
    let ctx: gsap.Context | null = null;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        gsap.from('.board-head__word', {
          yPercent: 100,
          opacity: 0,
          stagger: 0.07,
          duration: 0.75,
          ease: 'power4.out',
          scrollTrigger: { trigger: '.board-head', start: 'top 88%', once: true },
        });
        gsap.from('.tf-column', {
          y: 64,
          opacity: 0,
          stagger: 0.11,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: { trigger: '#board-grid', start: 'top 85%', once: true },
        });
        gsap.from('.tf-card', {
          y: 22,
          opacity: 0,
          scale: 0.965,
          stagger: 0.035,
          duration: 0.55,
          delay: 0.35,
          ease: 'power2.out',
          scrollTrigger: { trigger: '#board-grid', start: 'top 85%', once: true },
        });
        ScrollTrigger.refresh();
      }, rootRef);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ctx?.revert();
    };
  }, [boardReady]);

  // Pop-in for a freshly created card
  useEffect(() => {
    if (lastTaskId == null) return;
    const node = document.querySelector(`[data-task-id="${lastTaskId}"]`);
    if (node) {
      gsap.from(node, {
        y: 18,
        opacity: 0,
        scale: 0.94,
        duration: 0.5,
        ease: 'back.out(1.9)',
        clearProps: 'all',
      });
    }
    setLastTaskId(null);
  }, [lastTaskId]);

  const filteredColumns = useMemo(() => {
    if (!board) return [];
    const q = query.trim().toLowerCase();
    return board.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter(
        (task) =>
          (filter === 'All' || task.priority === filter) &&
          (q === '' || task.title.toLowerCase().includes(q))
      ),
    }));
  }, [board, filter, query]);

  const totals = useMemo(() => {
    if (!board) return null;
    const all = board.columns.flatMap((c) => c.tasks);
    const by: Record<Priority, number> = { Low: 0, Medium: 0, High: 0 };
    for (const t of all) by[t.priority] += 1;
    return { all: all.length, by };
  }, [board]);

  const visibleTotal = filteredColumns.reduce((n, c) => n + c.tasks.length, 0);
  const filtering = filter !== 'All' || query.trim() !== '';

  const handleMove = useCallback(
    async (taskId: number, toColumnId: number) => {
      if (!board) return;
      const task = board.columns.flatMap((c) => c.tasks).find((t) => t.id === taskId);
      if (!task || task.column_id === toColumnId) return; // harmless no-op

      const snapshot = board;
      // Optimistic move
      setBoard({
        ...board,
        columns: board.columns.map((c) => ({
          ...c,
          tasks:
            c.id === task.column_id
              ? c.tasks.filter((t) => t.id !== taskId)
              : c.id === toColumnId
                ? [{ ...task, column_id: toColumnId }, ...c.tasks]
                : c.tasks,
        })),
      });
      try {
        const moved = await api.moveTask(taskId, toColumnId);
        setBoard((prev) =>
          prev
            ? {
                ...prev,
                columns: prev.columns.map((c) => ({
                  ...c,
                  tasks: c.tasks.map((t) => (t.id === moved.id ? moved : t)),
                })),
              }
            : prev
        );
        const target = board.columns.find((c) => c.id === toColumnId);
        toasts.push('success', `Moved “${task.title}” to ${target?.name ?? 'another column'}`);
        onDataChange();
      } catch (err) {
        setBoard(snapshot); // roll back
        toasts.push(
          'error',
          `Couldn't move the task — ${err instanceof Error ? err.message : 'unknown error'}`
        );
      }
    },
    [board, onDataChange, toasts]
  );

  const handleCreate = useCallback(
    async (draft: TaskDraft) => {
      const created = await api.createTask(draft); // throws → modal surfaces it
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              columns: prev.columns.map((c) =>
                c.id === created.column_id ? { ...c, tasks: [created, ...c.tasks] } : c
              ),
            }
          : prev
      );
      setLastTaskId(created.id);
      toasts.push('success', 'Task created');
      onDataChange();
    },
    [onDataChange, toasts]
  );

  const handleUpdate = useCallback(
    async (id: number, draft: Omit<TaskDraft, 'column_id'>) => {
      const updated = await api.updateTask(id, draft);
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              columns: prev.columns.map((c) => ({
                ...c,
                tasks: c.tasks.map((t) => (t.id === updated.id ? updated : t)),
              })),
            }
          : prev
      );
      toasts.push('success', 'Task updated');
      onDataChange();
    },
    [onDataChange, toasts]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      const snapshot = board;
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              columns: prev.columns.map((c) => ({
                ...c,
                tasks: c.tasks.filter((t) => t.id !== id),
              })),
            }
          : prev
      );
      try {
        await api.deleteTask(id);
        toasts.push('success', 'Task deleted');
        onDataChange();
      } catch (err) {
        setBoard(snapshot);
        toasts.push(
          'error',
          `Couldn't delete the task — ${err instanceof Error ? err.message : 'unknown error'}`
        );
      }
    },
    [board, onDataChange, toasts]
  );

  return (
    <section className="board-section" id="board" ref={rootRef}>
      <div className="section-shell">
        <header className="board-head">
          <p className="section-eyebrow">The board</p>
          <h2 className="section-title">
            {'One team. One board.'.split(' ').map((w) => (
              <span key={w} className="board-head__mask">
                <span className="board-head__word">{w}&nbsp;</span>
              </span>
            ))}
          </h2>
          <p className="section-sub">
            Everything below is live. Create, edit, drag, filter — each change hits the
            Express API and lands in SQLite before the UI settles.
          </p>
        </header>

        {error && <ErrorState message={error} onRetry={() => void load()} />}

        {!error && !board && (
          <div className="board-grid board-grid--loading" aria-label="Loading board">
            {[0, 1, 2].map((i) => (
              <div className="tf-column tf-column--skeleton" key={i}>
                <div className="skeleton skeleton--title" />
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton skeleton--short" />
              </div>
            ))}
          </div>
        )}

        {!error && board && (
          <>
            <div className="board-toolbar">
              <div className="search">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title…"
                  aria-label="Search tasks by title"
                />
                {query && (
                  <button className="search__clear" onClick={() => setQuery('')} aria-label="Clear search">
                    ×
                  </button>
                )}
              </div>

              <div className="chip-row" role="group" aria-label="Filter by priority">
                {(['All', ...PRIORITIES] as PriorityFilter[]).map((p) => (
                  <button
                    key={p}
                    className={`chip chip--${p.toLowerCase()} ${filter === p ? 'is-active' : ''}`}
                    onClick={() => setFilter(p)}
                    aria-pressed={filter === p}
                  >
                    {p !== 'All' && <span className="chip__dot" />}
                    {p}
                    <span className="chip__count">
                      {totals ? (p === 'All' ? totals.all : totals.by[p as Priority]) : 0}
                    </span>
                  </button>
                ))}
              </div>

              <button
                className="btn btn--primary board-toolbar__new"
                onClick={() => setModal({ mode: 'create', columnId: board.columns[0]?.id ?? 1 })}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
                New Task
              </button>
            </div>

            {filtering && visibleTotal === 0 && (
              <div className="board-empty-filter">
                <p>
                  Nothing matches
                  {filter !== 'All' ? <> priority <strong>{filter}</strong></> : ''}
                  {query.trim() && (
                    <>
                      {' '}for “<strong>{query.trim()}</strong>”
                    </>
                  )}
                  .
                </p>
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    setFilter('All');
                    setQuery('');
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}

            <div className="board-grid" id="board-grid">
              {filteredColumns.map((column, i) => (
                <ColumnView
                  key={column.id}
                  column={column}
                  accentIndex={i}
                  rawCount={board.columns[i]?.tasks.length ?? 0}
                  filterActive={filtering}
                  columns={board.columns}
                  drag={drag}
                  onDragStateChange={setDrag}
                  onAdd={() => setModal({ mode: 'create', columnId: column.id })}
                  onEdit={(task) => setModal({ mode: 'edit', task })}
                  onMove={handleMove}
                />
              ))}
            </div>

            <p className="board-footnote">
              Tip: drag a card onto another lane, or use the move menu on the card.
              Reload the page — the SQLite database remembers everything.
            </p>
          </>
        )}
      </div>

      {modal && board && (
        <TaskModal
          state={modal}
          columns={board.columns}
          onClose={() => setModal(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
}
