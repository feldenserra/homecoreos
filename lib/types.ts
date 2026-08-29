export const TASK_STATUSES = [
  "not_started",
  "in_progress",
  "stuck",
  "complete",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const HOME_MEMBER_ROLES = ["owner", "member"] as const;
export type HomeMemberRole = (typeof HOME_MEMBER_ROLES)[number];

export const CHAT_MESSAGE_ROLES = ["user", "assistant", "system"] as const;
export type ChatMessageRole = (typeof CHAT_MESSAGE_ROLES)[number];
