import { create } from "zustand";
import type { Task } from "@/types/task";

interface TaskState {
  tasks: Task[];
  init: (data: { tasks: Task[] }) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  init: ({ tasks }) => set({ tasks }),
}));
