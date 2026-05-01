// Notification Types — spec 011-notification-system
// 32 types across 7 categories

export enum NotificationCategory {
  HACKATHON = 'hackathon',
  DUEL = 'duel',
  DISCUSSION = 'discussion',
  SUBMISSION = 'submission',
  CANVAS = 'canvas',
  ACHIEVEMENT = 'achievement',
  SYSTEM = 'system',
}

export enum NotificationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum NotificationType {
  // Hackathon (8)
  HACKATHON_STARTING = 'hackathon_starting',
  HACKATHON_ACTIVE = 'hackathon_active',
  HACKATHON_ENDED = 'hackathon_ended',
  HACKATHON_TEAM_JOINED = 'hackathon_team_joined',
  HACKATHON_TEAM_LEFT = 'hackathon_team_left',
  HACKATHON_CLARIFICATION = 'hackathon_clarification',
  HACKATHON_ANTICHEAT_ALERT = 'hackathon_anticheat_alert',
  HACKATHON_SUBMISSION_AC = 'hackathon_submission_ac',
  // Duel (5)
  DUEL_MATCHED = 'duel_matched',
  DUEL_RESULT = 'duel_result',
  DUEL_ELO_CHANGE = 'duel_elo_change',
  DUEL_STREAK = 'duel_streak',
  DUEL_CHALLENGE = 'duel_challenge',
  // Discussion (5)
  DISCUSSION_REPLY = 'discussion_reply',
  DISCUSSION_BEST_ANSWER = 'discussion_best_answer',
  DISCUSSION_VOTE = 'discussion_vote',
  DISCUSSION_FLAGGED = 'discussion_flagged',
  DISCUSSION_MENTION = 'discussion_mention',
  // Submission (4)
  SUBMISSION_ACCEPTED = 'submission_accepted',
  SUBMISSION_REJECTED = 'submission_rejected',
  SUBMISSION_FIRST_AC = 'submission_first_ac',
  SUBMISSION_REVIEW = 'submission_review',
  // Canvas (3)
  CANVAS_COMPLETED = 'canvas_completed',
  CANVAS_STREAK = 'canvas_streak',
  CANVAS_NEW = 'canvas_new',
  // Achievement (4)
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  ACHIEVEMENT_LEVEL_UP = 'achievement_level_up',
  ACHIEVEMENT_RANK_CHANGE = 'achievement_rank_change',
  ACHIEVEMENT_MILESTONE = 'achievement_milestone',
  // System (3)
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SECURITY_ALERT = 'security_alert',
}

export interface Notification {
  id: string;
  recipientId: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  senderId?: string | null;
  senderName?: string | null;
  senderPhoto?: string | null;
  isRead: boolean;
  readAt?: string | null;
  isArchived: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  hackathon: boolean;
  duel: boolean;
  discussion: boolean;
  submission: boolean;
  canvas: boolean;
  achievement: boolean;
  system: boolean;
  inApp: boolean;
  email: boolean;
  push: boolean;
  quietStart: string | null;
  quietEnd: string | null;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreference = {
  hackathon: true,
  duel: true,
  discussion: true,
  submission: true,
  canvas: true,
  achievement: true,
  system: true,
  inApp: true,
  email: false,
  push: false,
  quietStart: null,
  quietEnd: null,
};

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
