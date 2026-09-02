export type Task = {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
};

export type Developer = {
  _id: string;
  name: string;
  role: string;
  color: string;
  email: string;
  skills: string[];
  taskCount: number;
  doneCount: number;
  progress: number;
  tasks: Task[];
};

export type Milestone = {
  _id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string | null;
  taskCount: number;
  doneCount: number;
  progress: number;
  developers: Developer[];
};

export type Tree = {
  project: {
    _id: string;
    name: string;
    client: string;
    description: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    taskCount: number;
    doneCount: number;
    progress: number;
  };
  milestones: Milestone[];
};
