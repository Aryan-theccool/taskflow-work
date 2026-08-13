import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import type { BoardColumn, Priority, Task, TaskDraft } from '../types';
import { PRIORITIES } from '../types';
import type { ModalState } from './BoardSection';
import { gsap } from '../gsapSetup';

interface Props {
  state: NonNullable<ModalState>;
  columns: BoardColumn[];
  onClose: () => void;
  onCreate: (draft: TaskDraft) => Promise<void>;
  onUpdate: (id: number, draft: Omit<TaskDraft, 'column_id'>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TaskModal({
  state,
  columns,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const isEdit = state.mode === 'edit';
  const editingTask = isEdit ? (state as { mode: 'edit'; task: Task }).task : null;

  const [title, setTitle] = useState(editingTask?.title ?? '');
  const [description, setDescription] = useState(editingTask?.description ?? '');
  const [priority, setPriority] = useState<Priority>(editingTask?.priority ?? 'Medium');
  const [columnId, setColumnId] = useState<number>(
    state.mode === 'create' ? state.columnId : (editingTask?.column_id ?? columns[0]?.id)
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Entrance
  useEffect(() => {
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.28 });
    gsap.fromTo(
      panelRef.current,
      { y: 34, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' }
    );
  }, []);

  // Animated close, then inform the parent
  useEffect(() => {
    if (!closing) return;
    let done = false;
    const tl = gsap.timeline({
      onComplete: () => {
        if (!done) onClose();
        done = true;
      },
    });
    tl.to(panelRef.current, { y: 24, opacity: 0, scale: 0.97, duration: 0.24, ease: 'power2.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.2 }, 0);
    return () => {
      tl.kill();
      if (!done) onClose();
      done = true;
    };
  }, [closing, onClose]);

  // Escape closes (unless mid-save)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) setClosing(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving]);

  const stopKeys = (e: ReactKeyboardEvent) => e.stopPropagation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return; // guard against double-submit
    if (title.trim().length === 0) {
      setTitleError('Title is required');
      gsap.fromTo(panelRef.current, { x: -7 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.35)' });
      return;
    }
    setTitleError(null);
    setServerError(null);
    setSaving(true);
    try {
      if (isEdit && editingTask) {
        await onUpdate(editingTask.id, { title: title.trim(), description, priority });
      } else {
        await onCreate({ title: title.trim(), description, priority, column_id: columnId });
      }
      setClosing(true);
    } catch (err) {
      // Server rejected anyway (e.g. empty title raced through) — surface it.
      setServerError(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!editingTask || saving) return;
    setSaving(true);
    setServerError(null);
    try {
      await onDelete(editingTask.id);
      setClosing(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Delete failed');
      setSaving(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      ref={backdropRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) setClosing(true);
      }}
    >
      <div
        className="modal"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Edit task' : 'New task'}
        onKeyDown={stopKeys}
      >
        <header className="modal__head">
          <h3>{isEdit ? 'Edit task' : 'New task'}</h3>
          <button className="modal__close" onClick={() => !saving && setClosing(true)} aria-label="Close">
            ×
          </button>
        </header>

        <form onSubmit={submit} noValidate>
          <label className="field">
            <span className="field__label">
              Title <em>*</em>
            </span>
            <input
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError && e.target.value.trim()) setTitleError(null);
              }}
              placeholder="e.g. Wire up the move endpoint"
              className={titleError ? 'field__input--error' : ''}
              maxLength={200}
            />
            {titleError && <span className="field__error">{titleError}</span>}
          </label>

          <label className="field">
            <span className="field__label">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional context, links or acceptance notes…"
              rows={3}
              maxLength={2000}
            />
          </label>

          <div className="field">
            <span className="field__label">Priority</span>
            <div className="segmented" role="radiogroup" aria-label="Priority">
              {PRIORITIES.map((p) => (
                <button
                  type="button"
                  key={p}
                  role="radio"
                  aria-checked={priority === p}
                  className={`segmented__opt segmented__opt--${p.toLowerCase()} ${
                    priority === p ? 'is-selected' : ''
                  }`}
                  onClick={() => setPriority(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {!isEdit && (
            <label className="field">
              <span className="field__label">Column</span>
              <select value={columnId} onChange={(e) => setColumnId(Number(e.target.value))}>
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {serverError && (
            <p className="modal__server-error" role="alert">
              {serverError}
            </p>
          )}

          <footer className="modal__foot">
            {isEdit && !confirmingDelete && (
              <button
                type="button"
                className="btn btn--danger-ghost"
                onClick={() => setConfirmingDelete(true)}
                disabled={saving}
              >
                Delete
              </button>
            )}
            {confirmingDelete && (
              <div className="modal__confirm">
                <span>Delete for good?</span>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={confirmDelete}
                  disabled={saving}
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={saving}
                >
                  Keep
                </button>
              </div>
            )}
            <div className="modal__foot-right">
              <button type="button" className="btn btn--ghost" onClick={() => setClosing(true)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
