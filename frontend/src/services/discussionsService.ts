import api from '../api/axios';

export interface Discussion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: { id: string; username: string; profileImage?: string };
  category: string;
  companyId?: string;
  tags: string[];
  challengeId?: string;
  upvotes: string[];
  downvotes: string[];
  userVote?: 'upvote' | 'downvote' | null;
  commentCount: number;
  views: number;
  isSolved: boolean;
  bestAnswerCommentId?: string;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: { id: string; username: string; profileImage?: string };
  discussionId: string;
  parentCommentId?: string;
  upvotes: string[];
  downvotes: string[];
  userVote?: 'upvote' | 'downvote' | null;
  isBestAnswer?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const discussionsService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    category?: string;
    tags?: string;
    search?: string;
    sort?: string;
    companyId?: string;
  }) {
    const { companyId, ...query } = params || {};
    const path = companyId ? `/discussions/company/${companyId}` : '/discussions';
    const { data } = await api.get(path, { params: query });
    return data;
  },

  async getStats() {
    const { data } = await api.get('/discussions/stats');
    return data;
  },

  async getPopularTags() {
    const { data } = await api.get('/discussions/tags/popular');
    return data;
  },

  async getById(id: string, companyId?: string) {
    const path = companyId ? `/discussions/company/${companyId}/${id}` : `/discussions/${id}`;
    const { data } = await api.get(path);
    return data;
  },

  async create(discussion: { title: string; content: string; category?: string; tags: string[]; challengeId?: string; companyId?: string }) {
    const { data } = await api.post('/discussions', discussion);
    return data;
  },

  async update(id: string, discussion: { title?: string; content?: string; category?: string; tags?: string[]; companyId?: string | null }) {
    const { data } = await api.patch(`/discussions/${id}`, discussion);
    return data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/discussions/${id}`);
    return data;
  },

  async vote(id: string, type: 'upvote' | 'downvote') {
    const { data } = await api.post(`/discussions/${id}/vote`, { type });
    return data;
  },

  async solve(id: string) {
    const { data } = await api.patch(`/discussions/${id}/solve`);
    return data;
  },

  async getRevisions(id: string) {
    const { data } = await api.get(`/discussions/${id}/revisions`);
    return data;
  },

  // Comments
  async addComment(discussionId: string, comment: { content: string; parentCommentId?: string }) {
    const { data } = await api.post(`/discussions/${discussionId}/comments`, comment);
    return data;
  },

  async updateComment(commentId: string, content: string) {
    const { data } = await api.patch(`/discussions/comments/${commentId}`, { content });
    return data;
  },

  async deleteComment(commentId: string) {
    const { data } = await api.delete(`/discussions/comments/${commentId}`);
    return data;
  },

  async voteComment(commentId: string, type: 'upvote' | 'downvote') {
    const { data } = await api.post(`/discussions/comments/${commentId}/vote`, { type });
    return data;
  },

  async bestAnswer(commentId: string) {
    const { data } = await api.patch(`/discussions/comments/${commentId}/best-answer`);
    return data;
  },

  // My posts
  async getMyPosts(status?: 'all' | 'unsolved' | 'solved') {
    const { data } = await api.get('/discussions/my-posts', { params: { status } });
    return data;
  },

  // Moderation
  async flagDiscussion(id: string) {
    const { data } = await api.post(`/discussions/${id}/flag`);
    return data;
  },

  async flagComment(commentId: string) {
    const { data } = await api.post(`/discussions/comments/${commentId}/flag`);
    return data;
  },
};
