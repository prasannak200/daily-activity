
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  dueDate: string; // YYYY-MM-DD format
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface Soundscape {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type FilterType = 'all' | 'active' | 'completed';
export type AppTab = 'tasks' | 'focus' | 'notes' | 'music';

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}
