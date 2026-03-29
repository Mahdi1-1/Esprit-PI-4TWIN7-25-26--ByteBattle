// Discussion Forum mock data and types

export interface DiscussionComment {
  id: string;
  author: {
    id?: string;
    username: string;
    avatar: string;
    level: number;
  };
  content: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'upvote' | 'downvote' | null;
  parentId?: string;
  isAccepted?: boolean;
  replies?: DiscussionComment[];
}

export interface DiscussionPost {
  id: string;
  title: string;
  author: {
    id?: string;
    username: string;
    avatar: string;
    level: number;
  };
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'upvote' | 'downvote' | null;
  views: number;
  commentCount: number;
  isPinned: boolean;
  isSolved: boolean;
  comments?: DiscussionComment[];
}

export const discussionCategories = [
  { id: 'all', label: 'All', color: 'var(--text-muted)', icon: '💬' },
  { id: 'general', label: 'General', color: 'var(--brand-primary)', icon: '📢' },
  { id: 'help', label: 'Help', color: 'var(--state-warning)', icon: '❓' },
  { id: 'algorithms', label: 'Algorithms', color: 'var(--state-success)', icon: '🧮' },
  { id: 'challenge', label: 'Challenge Discussion', color: 'var(--state-info)', icon: '💡' },
  { id: 'showcase', label: 'Showcase', color: 'var(--state-error)', icon: '🏆' },
  { id: 'feedback', label: 'Feedback', color: 'var(--brand-secondary)', icon: '📝' },
];
