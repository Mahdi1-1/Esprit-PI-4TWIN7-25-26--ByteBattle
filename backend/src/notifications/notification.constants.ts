/** Shared notification enums — used by services that emit notifications */

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
  // Hackathon
  HACKATHON_STARTING = 'hackathon_starting',
  HACKATHON_STARTED = 'hackathon_started',
  HACKATHON_ENDED = 'hackathon_ended',
  HACKATHON_TEAM_JOINED = 'hackathon_team_joined',
  HACKATHON_TEAM_LEFT = 'hackathon_team_left',
  HACKATHON_ANNOUNCEMENT = 'hackathon_announcement',
  HACKATHON_RESULT = 'hackathon_result',
  // Duel
  DUEL_MATCHED = 'duel_matched',
  DUEL_STARTED = 'duel_started',
  DUEL_RESULT = 'duel_result',
  DUEL_ELO_MILESTONE = 'duel_elo_milestone',
  DUEL_STREAK = 'duel_streak',
  // Discussion
  DISCUSSION_REPLY = 'discussion_reply',
  DISCUSSION_MENTION = 'discussion_mention',
  DISCUSSION_VOTE = 'discussion_vote',
  // Submission
  SUBMISSION_GRADED = 'submission_graded',
  SUBMISSION_PASSED = 'submission_passed',
  SUBMISSION_FAILED = 'submission_failed',
  // Canvas
  CANVAS_COLLABORATION = 'canvas_collaboration',
  // Achievement
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  BADGE_EARNED = 'badge_earned',
  // System
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  SYSTEM_MAINTENANCE = 'system_maintenance',
}
