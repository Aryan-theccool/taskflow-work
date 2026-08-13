import type { Board, ColumnStat, Priority, PriorityTask, Task, TaskDraft } from '../types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// API base URL - use environment variable or fallback to current origin
const API_BASE = import.meta.env.VITE_API_URL || 'https://taskflow-work-backend.onrender.com';

/**
 * Single wrapper around every request: network failures and non-2xx responses
 * both become a readable Error the UI can surface (never a blank screen).
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError(
      'Could not reach the TaskFlow server — is the backend running?',
      0
    );
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && typeof body.error === 'string') message = body.error;
    } catch {
      /* keep the generic message */
    }
    throw new ApiError(message, res.status);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export const api = {
  getBoard: (boardId = 1) => request<Board>(`/boards/${boardId}`),

  getBoardStats: (boardId = 1) => request<ColumnStat[]>(`/boards/${boardId}/stats`),

  getTasksByPriority: (priority: Priority, boardId = 1) =>
    request<PriorityTask[]>(`/tasks?priority=${priority}&board_id=${boardId}`),

  createTask: (draft: TaskDraft) =>
    request<Task>('/tasks', json('POST', draft)),

  updateTask: (id: number, draft: Omit<TaskDraft, 'column_id'>) =>
    request<Task>(`/tasks/${id}`, json('PUT', draft)),

  moveTask: (id: number, columnId: number) =>
    request<Task>(`/tasks/${id}/move`, json('PATCH', { column_id: columnId })),

  deleteTask: (id: number) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};

