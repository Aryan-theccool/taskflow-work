import { useState, type DragEvent } from 'react';
import type { BoardColumn, Task } from '../types';
import type { DragState } from './BoardSection';
import TaskCardView from './TaskCardView';

export default function ColumnView({
  column,
  accentIndex,
  rawCount,
  filterActive,
  columns,
  drag,
  onDragStateChange,
  onAdd,
  onEdit,
  onMove,
}: {
  column: BoardColumn;
  accentIndex: number;
  rawCount: number;
  filterActive: boolean;
  columns: BoardColumn[];
  drag: DragState | null;
  onDragStateChange: (d: DragState | null) => void;
  onAdd: () => void;
  onEdit: (task: Task) => void;
  onMove: (taskId: number, columnId: number) => void;
}) {
  const [isOver, setIsOver] = useState(false);
  const draggingElsewhere = drag !== null && drag.fromColumnId !== column.id;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggingElsewhere) setIsOver(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const raw = e.dataTransfer.getData('application/x-taskflow-task');
    if (!raw) return;
    try {
      const { taskId } = JSON.parse(raw) as { taskId: number };
      onMove(taskId, column.id);
    } catch {
      /* malformed payload — ignore */
    }
  };

  return (
    <div
      className={[
        'tf-column',
        `tf-column--accent-${accentIndex % 3}`,
        draggingElsewhere ? 'is-droppable' : '',
        isOver ? 'is-over' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
    >
      <header className="tf-column__head">
        <span className="tf-column__accent" aria-hidden="true" />
        <h3>{column.name}</h3>
        <span className="tf-column__count" title={`${rawCount} total`}>
          {filterActive ? `${column.tasks.length}/${rawCount}` : column.tasks.length}
        </span>
        <button className="tf-column__add" onClick={onAdd} aria-label={`Add a task to ${column.name}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="tf-column__body">
        {column.tasks.map((task) => (
          <TaskCardView
            key={task.id}
            task={task}
            columns={columns}
            dragging={drag?.taskId === task.id}
            onDragStateChange={onDragStateChange}
            onEdit={() => onEdit(task)}
            onMove={onMove}
          />
        ))}

        {column.tasks.length === 0 && (
          <div className="tf-column__empty">
            {filterActive && rawCount > 0 ? (
              <p>No tasks match the current filters.</p>
            ) : (
              <>
                <p>No tasks yet.</p>
                <button className="tf-column__empty-add" onClick={onAdd}>
                  + Add the first one
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {draggingElsewhere && (
        <div className="tf-column__drop-hint" aria-hidden="true">
          Drop to move here
        </div>
      )}
    </div>
  );
}
