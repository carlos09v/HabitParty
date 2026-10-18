export interface AdminOverviewDTO {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  founderUsers?: number;
  adminUsers: number;
  emailsSentThisMonth: number;
  resendMonthlyQuota: number;
  resendQuotaPercentage: number;
  totalTasksCount: number;
  totalActiveTasksCount: number;
  estimatedDatabaseSizeBytes: number;
  estimatedDatabaseSizeFormatted: string;
}

export interface AdminUserSummaryDTO {
  id: string;
  fullName: string;
  username: string;
  email: string;
  profilePhotoUrl?: string | null;
  role: "USER" | "ADMIN";
  isPremium: boolean;
  isFounder?: boolean;
  subscriptionStatus: string;
  createdAt: string;
  emailsSentThisMonth: number;
  activeEmailReminders: number;
  totalTasksCount: number;
  activeTasksCount: number;
  estimatedStorageBytes: number;
  estimatedStorageFormatted: string;
}

export interface UserStorageBreakdownDTO {
  tasksBytes: number;
  tasksCount: number;
  activeTasksCount: number;
  checklistsBytes: number;
  checklistsCount: number;
  workspacesBytes: number;
  workspacesCount: number;
  historyBytes: number;
  historyCount: number;
  inventoryBytes: number;
  inventoryCount: number;
  focusBytes: number;
  focusCount: number;
  userRowBytes: number;
  totalBytes: number;
  totalFormatted: string;
}

export interface EmailDispatchLogDTO {
  id: string;
  taskId?: string | null;
  emailType: "TASK_REMINDER" | "PASSWORD_RESET" | "SYSTEM";
  recipientEmail: string;
  subject: string;
  status: "SENT" | "FAILED";
  errorMessage?: string | null;
  sentAt: string;
}

export interface AdminUserDetailDTO {
  summary: AdminUserSummaryDTO;
  storage: UserStorageBreakdownDTO;
  recentEmailLogs: EmailDispatchLogDTO[];
}

export interface AdminUsersPageResponse {
  content: AdminUserSummaryDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
