import { useEffect, useRef, useState, type DragEvent as ReactDragEvent } from 'react';
import type { BoardColumn, Task } from '../types';
import type { DragState } from './BoardSection';
import { relativeTime } from '../utils/time';
import { gsap } from '../gsapSetup';

export default function TaskCardView({
  task,
  columns,
  dragging,
  onDragStateChange,
  onEdit,
  onMove,
}: {
  task: Task;
  columns: BoardColumn[];
  dragging: boolean;
  onDragStateChange: (d: DragState | null) => void;
  onEdit: () => void;
  onMove: (taskId: number, columnId: number) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const justDragged = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 3D tilt on hover — GSAP quickTo keeps it at 60fps without re-renders
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    gsap.set(el, { transformPerspective: 760 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 8);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
    };
    const leave = () => {
      rx(0);
      ry(0);
    };
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', leave);
    };
  }, []);

  // Close the move menu on any outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleDragStart = (e: ReactDragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData(
      'application/x-taskflow-task',
      JSON.stringify({ taskId: task.id })
    );
    e.dataTransfer.effectAllowed = 'move';
    onDragStateChange({ taskId: task.id, fromColumnId: task.column_id });
  };

  const handleDragEnd = () => {
    onDragStateChange(null);
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 140);
  };

  const targets = columns.filter((c) => c.id !== task.column_id);

  return (
    <article
      ref={cardRef}
      className={`tf-card tf-card--${task.priority.toLowerCase()} ${dragging ? 'is-dragging' : ''}`}
      data-task-id={task.id}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => {
        if (!justDragged.current) onEdit();
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEdit();
      }}
      aria-label={`Task: ${task.title}. Priority ${task.priority}. Press Enter to edit.`}
    >
      <div className="tf-card__top">
        <span className={`tag tag--${task.priority.toLowerCase()}`}>
          <span className="tag__dot" />
          {task.priority}
        </span>
        <button
          className="tf-card__move-btn"
          aria-label="Move task to another column"
          aria-expanded={menuOpen}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M8 7h11m0 0-3.2-3.2M19 7l-3.2 3.2M16 17H5m0 0 3.2-3.2M5 17l3.2 3.2"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <h4 className="tf-card__title">{task.title}</h4>
      {task.description && <p className="tf-card__desc">{task.description}</p>}

      <div className="tf-card__foot">
        <time dateTime={task.created_at}>{relativeTime(task.created_at)}</time>
      </div>

      {menuOpen && (
        <div
          className="tf-card__menu"
          role="menu"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="tf-card__menu-label">Move to</p>
          {targets.map((c) => (
            <button
              key={c.id}
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onMove(task.id, c.id);
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
