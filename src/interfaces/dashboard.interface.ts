export interface AdminDashboard {
  projects?: number;
  todayTasks?: number;
  freeResources?: number;
  users?: number;
  assignUsers?: number;
  admins?: number;
  projectCategories?: number;
}

export interface UserDashboard {
  projects?: number;
  pendingTasks?: number;
  completeTasks?: number;
}
