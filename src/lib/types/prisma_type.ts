export const Role = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const Priority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const NotificationType = {
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_STATUS_CHANGED: "TASK_STATUS_CHANGED",
  TASK_COMMENTED: "TASK_COMMENTED",
  TASK_DUE_SOON: "TASK_DUE_SOON",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const InvitationStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
} as const;
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

export { Prisma } from "@/generated/prisma";

export type {
  User,
  Task,
  Label,
  TaskLabel,
  Comment,
  ActivityLog,
  Notification,
  Board,
  Column,
  Account,
  Session,
  VerificationToken,
  ChatMessage,
  ChatReaction,
  Invitation,
} from "@/generated/prisma";



