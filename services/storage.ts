
import { Task, Note } from '../types';

const getTaskKey = (userId: string) => `day_to_day_tasks_${userId}`;
const getNoteKey = (userId: string) => `day_to_day_notes_${userId}`;

export const storageService = {
  // Task methods
  getTasks: (userId: string): Task[] => {
    const data = localStorage.getItem(getTaskKey(userId));
    return data ? JSON.parse(data) : [];
  },
  
  saveTasks: (userId: string, tasks: Task[]): void => {
    localStorage.setItem(getTaskKey(userId), JSON.stringify(tasks));
  },

  // Note methods
  getNotes: (userId: string): Note[] => {
    const data = localStorage.getItem(getNoteKey(userId));
    return data ? JSON.parse(data) : [];
  },

  saveNotes: (userId: string, notes: Note[]): void => {
    localStorage.setItem(getNoteKey(userId), JSON.stringify(notes));
  }
};
