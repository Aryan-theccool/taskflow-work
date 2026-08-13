export type Priority = 'Low' | 'Medium' | 'High';

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];

export type PriorityFilter = 'All' | Priority;

export interface Task {
  id: number;
  column_id: number;
  title: string;
  description: string | null;
  priority: Priority;
  created_at: string;
}

export interface BoardColumn {
  id: number;
  board_id: number;
  name: string;
  position: number;
  tasks: Task[];
}

export interface Board {
  id: number;
  name: string;
  columns: BoardColumn[];
}

export interface ColumnStat {
  column_id: number;
  column_name: string;
  position: number;
  task_count: number;
}

export interface PriorityTask extends Task {
  column_name: string;
}

export interface TaskDraft {
  title: string;
  description: string;
  priority: Priority;
  column_id: number;
}
