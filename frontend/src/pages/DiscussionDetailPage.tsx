import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Eye, Pin,
  CheckCircle2, Share2, Bookmark, Flag, Clock, Send, Tag, Loader, Edit, Trash2, Pencil, History, X
} from 'lucide-react';
import { discussionCategories, type DiscussionComment, type DiscussionPost } from '../data/discussionData';
import { discussionsService } from '../services/discussionsService';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';

/* ───── helpers ───── */

type SortMode = 'newest' | 'oldest' | 'top';

function formatDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function mapComment(c: any, currentUserId?: string): DiscussionComment {
  return {
    id: c.id,
    author: {
      id: c.author?.id,
      username: c.author?.username || 'Unknown',
      avatar: profileService.getPhotoUrl(c.author?.profileImage, c.author?.username),
      level: c.author?.level || 1,
    },
    content: c.content,
    createdAt: c.createdAt,  // keep raw ISO string for sorting
    upvotes: Array.isArray(c.upvotes) ? c.upvotes.length : (c.upvotes || 0),
    downvotes: Array.isArray(c.downvotes) ? c.downvotes.length : (c.downvotes || 0),
    userVote: currentUserId
      ? (Array.isArray(c.upvotes) && c.upvotes.includes(currentUserId) ? 'upvote'
        : Array.isArray(c.downvotes) && c.downvotes.includes(currentUserId) ? 'downvote'
          : null)
      : null,
    isAccepted: c.isBestAnswer || false,
    replies: (c.replies || []).map((r: any) => mapComment(r, currentUserId)),
  };
}

function sortComments(comments: DiscussionComment[], mode: SortMode): DiscussionComment[] {
  const sorted = [...comments];
  if (mode === 'newest') sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  else if (mode === 'oldest') sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  else if (mode === 'top') sorted.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  return sorted;
}

/* ───── Page ───── */

export function DiscussionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || undefined;
  const { user } = useAuth();
  const { t } = useLanguage();

  const [post, setPost] = useState<DiscussionPost | null>(null);
  const [loading, setLoading] = useState(true);

  // New top-level comment
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);   // commentId
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Revisions modal state
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);

  // Sort
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const discussionListRoute = companyId
    ? `/discussion?companyId=${encodeURIComponent(companyId)}`
    : '/discussion';

  const fetchPost = useCallback(async () => {
    try {
      const d = await discussionsService.getById(id!, companyId);
      if (d) {
        setPost({
          id: d.id,
          companyId: d.companyId,
          title: d.title,
          content: d.content,
          author: {
            id: d.authorId || d.author?.id,
            username: d.author?.username || 'Unknown',
            avatar: profileService.getPhotoUrl(d.author?.profileImage, d.author?.username),
            level: d.author?.level || 1,
          },
          category: d.tags?.[0] || 'general',
          tags: d.tags || [],
          upvotes: Array.isArray(d.upvotes) ? d.upvotes.length : (d.upvotes || 0),
          downvotes: Array.isArray(d.downvotes) ? d.downvotes.length : (d.downvotes || 0),
          commentCount: d.commentCount || 0,
          views: d.views || 0,
          createdAt: d.createdAt,  // keep raw ISO string for sorting
          updatedAt: d.updatedAt,
          isPinned: d.isPinned || false,
          isSolved: d.isSolved || false,
          userVote: user?.id && Array.isArray(d.upvotes) && d.upvotes.includes(user.id)
            ? 'upvote'
            : user?.id && Array.isArray(d.downvotes) && d.downvotes.includes(user.id)
              ? 'downvote'
              : undefined,
          comments: (d.comments || []).map((c: any) => mapComment(c, user?.id)),
        });
      }
    } catch (err) {
      console.error('Failed to load discussion:', err);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id, companyId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const fetchRevisions = async () => {
    if (!id) return;
    setRevisionsLoading(true);
    try {
      const data = await discussionsService.getRevisions(id);
      setRevisions(data || []);
    } catch (err) {
      console.error('Failed to load revisions:', err);
      setRevisions([]);
    } finally {
      setRevisionsLoading(false);
    }
  };

  const handleOpenRevisions = () => {
    setShowRevisions(true);
    setExpandedRevision(null);
    fetchRevisions();
  };

  if (loading) {
    return (
      <Layout>

        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>

        <div className="w-full px-4 sm:px-6 lg:px-10 py-20 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('discussion.notFound')}</h2>
          <Link to={discussionListRoute} className="text-[var(--brand-primary)] hover:underline mt-4 inline-block">
            ← {t('discussion.backToForum')}
          </Link>
        </div>
      </Layout>
    );
  }

  const cat = discussionCategories.find((c) => c.id === post.category);
  const isAuthor = !!(user && user.id === (post.author as any).id);

  /* ── Post actions ── */

  const handleToggleSolved = async () => {
    try {
      await discussionsService.solve(post.id);
      setPost({ ...post, isSolved: !post.isSolved });
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (type: 'upvote' | 'downvote') => {
    if (!user) { alert('Please log in to vote'); return; }
    if (isAuthor) { alert('You cannot vote on your own post'); return; }
    try {
      const { userVote: newVote, upvotes: newUp, downvotes: newDown } = await discussionsService.vote(post.id, type);
      setPost({ ...post, upvotes: newUp, downvotes: newDown, userVote: newVote ?? undefined });
    } catch (err) { console.error('Vote failed:', err); }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this discussion?')) {
      try {
        await discussionsService.delete(post.id);
        navigate(discussionListRoute);
      } catch (err) { console.error(err); }
    }
  };

  /* ── Comment actions ── */

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try {
      await discussionsService.addComment(post.id, { content: newComment.trim() });
      setNewComment('');
      await fetchPost();
    } catch (err) { console.error('Comment failed:', err); }
    finally { setSubmitting(false); }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim() || !user) return;
    setReplySubmitting(true);
    try {
      await discussionsService.addComment(post.id, {
        content: replyContent.trim(),
        parentCommentId,
      });
      setReplyContent('');
      setReplyingTo(null);
      await fetchPost();
    } catch (err) { console.error('Reply failed:', err); }
    finally { setReplySubmitting(false); }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    setEditSubmitting(true);
    try {
      await discussionsService.updateComment(commentId, editContent.trim());
      const updateInTree = (comments: DiscussionComment[]): DiscussionComment[] =>
        comments.map(c =>
          c.id === commentId
            ? { ...c, content: editContent.trim() }
            : { ...c, replies: updateInTree(c.replies || []) }
        );
      setPost({ ...post, comments: updateInTree(post.comments || []) });
      setEditingId(null);
    } catch (err) { console.error('Edit failed:', err); }
    finally { setEditSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await discussionsService.deleteComment(commentId);
      const removeFromTree = (comments: DiscussionComment[]): DiscussionComment[] =>
        comments
          .filter(c => c.id !== commentId)
          .map(c => ({ ...c, replies: removeFromTree(c.replies || []) }));
      setPost({
        ...post,
        comments: removeFromTree(post.comments || []),
        commentCount: post.commentCount - 1,
      });
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleVoteComment = async (commentId: string, type: 'upvote' | 'downvote') => {
    if (!user) { alert('Please log in to vote'); return; }
    try {
      const { userVote: newVote, upvotes: newUp, downvotes: newDown } = await discussionsService.voteComment(commentId, type);
      const updateInTree = (comments: DiscussionComment[]): DiscussionComment[] =>
        comments.map(c =>
          c.id === commentId
            ? { ...c, upvotes: newUp, downvotes: newDown, userVote: newVote ?? null }
            : { ...c, replies: updateInTree(c.replies || []) }
        );
      setPost({ ...post, comments: updateInTree(post.comments || []) });
    } catch (err) { console.error('Vote comment failed:', err); }
  };

  const handleToggleBestAnswer = async (commentId: string) => {
    if (!user || !isAuthor) return;
    try {
      await discussionsService.bestAnswer(commentId);
      const toggleInTree = (comments: DiscussionComment[]): DiscussionComment[] =>
        comments.map(c => {
          if (c.id === commentId) {
            return { ...c, isAccepted: !c.isAccepted };
          }
          // If marking a new best answer, unmark any existing one
          if (c.isAccepted && c.id !== commentId) {
            return { ...c, isAccepted: false };
          }
          return { ...c, replies: toggleInTree(c.replies || []) };
        });
      setPost({
        ...post,
        comments: toggleInTree(post.comments || []),
        isSolved: true,
      } as any);
    } catch (err) { console.error('Toggle best answer failed:', err); }
  };

  const handleFlagDiscussion = async () => {
    if (!user) return;
    if (window.confirm('Report this post as inappropriate?')) {
      try {
        await discussionsService.flagDiscussion(post.id);
        alert('Post reported. Thank you for your feedback.');
      } catch (err) { console.error('Flag failed:', err); }
    }
  };

  const handleFlagComment = async (commentId: string) => {
    if (!user) return;
    if (window.confirm('Report this comment as inappropriate?')) {
      try {
        await discussionsService.flagComment(commentId);
        alert('Comment reported. Thank you for your feedback.');
      } catch (err) { console.error('Flag failed:', err); }
    }
  };

  const sortedComments = sortComments(post.comments || [], sortMode);

  return (
    <Layout>


      <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8">
        {/* Back Link */}
        <Link
          to={discussionListRoute}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('discussion.backToForum')}
        </Link>

        {/* Post Card */}
        <div className="theme-card p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {post.isPinned && <Pin className="w-4 h-4 text-[var(--state-warning)]" />}
                {post.isSolved && (
                  <Badge variant="easy">
                    <CheckCircle2 className="w-3 h-3 mr-1" />{t('discussion.solved')}
                  </Badge>
                )}
                {cat && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-[var(--radius-sm)] bg-[var(--surface-2)] border-[var(--border-default)]"
                    style={{ color: cat.color }}
                  >
                    {cat.icon} {cat.label}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] leading-snug">
                {post.title}
              </h1>
            </div>
            {isAuthor && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleToggleSolved}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--state-success)] hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors"
                  title={post.isSolved ? 'Unmark solved' : 'Mark as solved'}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <Link
                  to={companyId
                    ? `/discussion/${post.id}/edit?companyId=${encodeURIComponent(companyId)}`
                    : `/discussion/${post.id}/edit`}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors"
                  title="Edit discussion"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleDelete}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--state-error)] hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors"
                  title="Delete discussion"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Author */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 shrink-0 rounded-full border-2 border-[var(--border-default)] overflow-hidden">
              <img
                src={post.author.avatar}
                alt={post.author.username}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-medium text-sm text-[var(--text-primary)]">{post.author.username}</span>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Clock className="w-3 h-3" /> {formatDate(post.createdAt)}
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <>
                    <span className="flex items-center gap-1 italic" title={`Last edited: ${formatDate(post.updatedAt)}`}>
                      <Pencil className="w-3 h-3" /> edited {formatDate(post.updatedAt)}
                    </span>
                    <button
                      onClick={handleOpenRevisions}
                      className="flex items-center gap-1 text-[var(--brand-primary)] hover:underline cursor-pointer"
                      title="View edit history"
                    >
                      <History className="w-3 h-3" /> view edits
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap text-sm mb-4">
            {post.content}
          </p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-default)] rounded-[var(--radius-sm)]"
                >
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--border-default)]">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => handleVote('upvote')}
                disabled={isAuthor}
                className={`flex items-center gap-1.5 text-sm transition-colors ${post.userVote === 'upvote' ? 'text-[var(--state-success)] font-medium' : 'text-[var(--text-secondary)] hover:text-[var(--state-success)]'} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <ThumbsUp className="w-4 h-4" /> {post.upvotes}
              </button>
              <button
                onClick={() => handleVote('downvote')}
                disabled={isAuthor}
                className={`flex items-center gap-1.5 text-sm transition-colors ${post.userVote === 'downvote' ? 'text-[var(--state-error)] font-medium' : 'text-[var(--text-secondary)] hover:text-[var(--state-error)]'} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <ThumbsDown className="w-4 h-4" /> {post.downvotes}
              </button>
              <span className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <Eye className="w-4 h-4" /> {post.views}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors">
                <Bookmark className="w-4 h-4" />
              </button>
              <button className="p-2 text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              {user && !isAuthor && (
                <button
                  onClick={handleFlagDiscussion}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--state-error)] hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors"
                  title="Report post"
                >
                  <Flag className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          {/* Header + Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--brand-primary)]" />
              {post.commentCount} {t('discussion.comments')}
            </h2>
            <div className="flex items-center gap-1 text-xs">
              {(['newest', 'oldest', 'top'] as SortMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSortMode(m)}
                  className={`px-3 py-1 rounded-full transition-colors capitalize ${sortMode === m
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* New Comment Box */}
          <div className="theme-card p-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? t('discussion.writeComment') : 'Log in to comment…'}
              disabled={!user}
              rows={3}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors resize-none disabled:opacity-50"
            />
            <div className="flex justify-end mt-2">
              <Button
                variant="primary"
                size="sm"
                disabled={!user || submitting || !newComment.trim()}
                onClick={handleSubmitComment}
              >
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t('discussion.postComment')}
              </Button>
            </div>
          </div>

          {/* Comment List */}
          {sortedComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              depth={0}
              currentUserId={user?.id}
              postAuthorId={(post.author as any).id}
              isPostAuthor={isAuthor}
              replyingTo={replyingTo}
              replyContent={replyContent}
              replySubmitting={replySubmitting}
              editingId={editingId}
              editContent={editContent}
              editSubmitting={editSubmitting}
              onStartReply={(cid) => {
                setReplyingTo(replyingTo === cid ? null : cid);
                setReplyContent('');
              }}
              onReplyContentChange={setReplyContent}
              onSubmitReply={handleSubmitReply}
              onStartEdit={(cid, content) => { setEditingId(cid); setEditContent(content); }}
              onEditContentChange={setEditContent}
              onSubmitEdit={handleEditComment}
              onCancelEdit={() => setEditingId(null)}
              onDelete={handleDeleteComment}
              onVote={handleVoteComment}
              onBestAnswer={handleToggleBestAnswer}
              onFlag={handleFlagComment}
            />
          ))}

          {sortedComments.length === 0 && (
            <div className="theme-card p-8 text-center">
              <MessageSquare className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-[var(--text-muted)]">{t('discussion.noComments')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Revisions Modal */}
      {showRevisions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <History className="w-5 h-5 text-[var(--brand-primary)]" />
                Edit History
              </h3>
              <button
                onClick={() => setShowRevisions(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {revisionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
                </div>
              ) : revisions.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-muted)]">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>No edit history found</p>
                </div>
              ) : (
                <>
                  {/* Current version banner */}
                  <div className="p-3 rounded-[var(--radius-md)] border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--brand-primary)]">
                      <CheckCircle2 className="w-4 h-4" />
                      Current version
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{formatDate(post.updatedAt || post.createdAt)}</p>
                  </div>

                  {/* Revisions list */}
                  {revisions.map((rev, idx) => {
                    const isExpanded = expandedRevision === rev.id;
                    return (
                      <div
                        key={rev.id}
                        className="border border-[var(--border-default)] rounded-[var(--radius-md)] overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedRevision(isExpanded ? null : rev.id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface-2)] text-xs font-bold text-[var(--text-secondary)] shrink-0">
                              {revisions.length - idx}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{rev.title}</p>
                              <p className="text-xs text-[var(--text-muted)]">
                                by {rev.editor?.username || 'Unknown'} · {formatDate(rev.createdAt)}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            ▾
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-[var(--border-default)] bg-[var(--surface-2)]/50">
                            <div className="mt-3 space-y-3">
                              <div>
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Title</span>
                                <p className="text-sm text-[var(--text-primary)] mt-1">{rev.title}</p>
                              </div>
                              <div>
                                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Content</span>
                                <p className="text-sm text-[var(--text-primary)] mt-1 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-[var(--surface-1)] p-3 rounded-[var(--radius-md)] border border-[var(--border-default)]">
                                  {rev.content}
                                </p>
                              </div>
                              {rev.tags && rev.tags.length > 0 && (
                                <div>
                                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Tags</span>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {rev.tags.map((tag: string) => (
                                      <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-default)] rounded-[var(--radius-sm)]"
                                      >
                                        <Tag className="w-3 h-3" /> {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[var(--border-default)] flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowRevisions(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

/* ───── Comment Card ───── */

interface CommentCardProps {
  comment: DiscussionComment;
  depth: number;
  currentUserId?: string;
  postAuthorId?: string;
  isPostAuthor?: boolean;
  replyingTo: string | null;
  replyContent: string;
  replySubmitting: boolean;
  editingId: string | null;
  editContent: string;
  editSubmitting: boolean;
  onStartReply: (id: string) => void;
  onReplyContentChange: (v: string) => void;
  onSubmitReply: (parentId: string) => void;
  onStartEdit: (id: string, content: string) => void;
  onEditContentChange: (v: string) => void;
  onSubmitEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onVote: (id: string, type: 'upvote' | 'downvote') => void;
  onBestAnswer: (id: string) => void;
  onFlag: (id: string) => void;
}

function CommentCard({
  comment,
  depth,
  currentUserId,
  postAuthorId,
  isPostAuthor,
  replyingTo,
  replyContent,
  replySubmitting,
  editingId,
  editContent,
  editSubmitting,
  onStartReply,
  onReplyContentChange,
  onSubmitReply,
  onStartEdit,
  onEditContentChange,
  onSubmitEdit,
  onCancelEdit,
  onDelete,
  onVote,
  onBestAnswer,
  onFlag,
}: CommentCardProps) {
  const isCommentAuthor = !!(currentUserId && comment.author.id && currentUserId === comment.author.id);
  const isEditing = editingId === comment.id;
  const isReplying = replyingTo === comment.id;

  return (
    <div className={`theme-card p-3 sm:p-4 ${depth > 0 ? 'ml-4 sm:ml-8 border-l-2 border-[var(--brand-primary)]/20' : ''} ${comment.isAccepted ? 'ring-1 ring-[var(--state-success)]/30' : ''}`}>
      <div className="flex gap-3">
        <img src={comment.author.avatar} alt={comment.author.username} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex-1 min-w-0">
          {/* Author row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            <span className="font-medium text-sm text-[var(--text-primary)]">{comment.author.username}</span>
            <span className="text-xs text-[var(--text-muted)]">Lv.{comment.author.level}</span>
            <span className="text-xs text-[var(--text-muted)]">· {formatDate(comment.createdAt)}</span>
            {comment.isAccepted && (
              <span className="flex items-center gap-1 text-xs text-[var(--state-success)]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Best Answer
              </span>
            )}
          </div>

          {/* Content or edit form */}
          {isEditing ? (
            <div className="mb-2">
              <textarea
                value={editContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                rows={3}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] resize-none"
              />
              <div className="flex gap-2 mt-1">
                <Button variant="primary" size="sm" disabled={editSubmitting} onClick={() => onSubmitEdit(comment.id)}>
                  {editSubmitting ? <Loader className="w-3 h-3 animate-spin" /> : 'Save'}
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancelEdit}>Cancel</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap mb-2">
              {comment.content}
            </p>
          )}

          {/* Actions row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Upvote */}
            <button
              onClick={() => onVote(comment.id, 'upvote')}
              disabled={isCommentAuthor}
              className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${comment.userVote === 'upvote' ? 'text-[var(--state-success)] font-medium' : 'text-[var(--text-muted)] hover:text-[var(--state-success)]'}`}
            >
              <ThumbsUp className="w-3.5 h-3.5" /> {comment.upvotes}
            </button>
            {/* Downvote */}
            <button
              onClick={() => onVote(comment.id, 'downvote')}
              disabled={isCommentAuthor}
              className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${comment.userVote === 'downvote' ? 'text-[var(--state-error)] font-medium' : 'text-[var(--text-muted)] hover:text-[var(--state-error)]'}`}
            >
              <ThumbsDown className="w-3.5 h-3.5" /> {comment.downvotes}
            </button>
            {/* Reply — hidden at depth >= 1 (max depth 2) */}
            {depth < 1 && (
              <button
                onClick={() => onStartReply(comment.id)}
                className={`text-xs transition-colors ${isReplying ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--brand-primary)]'}`}
              >
                Reply
              </button>
            )}
            {/* Edit/Delete — only for comment author */}
            {isCommentAuthor && !isEditing && (
              <>
                <button
                  onClick={() => onStartEdit(comment.id, comment.content)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors flex items-center gap-0.5"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--state-error)] transition-colors flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </>
            )}
            {/* Mark as Best Answer — only for post author (not the comment author) */}
            {isPostAuthor && !isCommentAuthor && !comment.isAccepted && (
              <button
                onClick={() => onBestAnswer(comment.id)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--state-success)] transition-colors flex items-center gap-0.5"
                title="Mark as best answer"
              >
                <CheckCircle2 className="w-3 h-3" /> Mark Best
              </button>
            )}
            {/* Flag — for non-authors (can't flag own content) */}
            {!isCommentAuthor && !isPostAuthor && (
              <button
                onClick={() => onFlag(comment.id)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--state-error)] transition-colors flex items-center gap-0.5"
                title="Report comment"
              >
                <Flag className="w-3 h-3" /> Flag
              </button>
            )}
          </div>

          {/* Reply input */}
          {isReplying && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                placeholder={`Reply to ${comment.author.username}…`}
                className="flex-1 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmitReply(comment.id); } }}
              />
              <Button variant="primary" size="sm" disabled={replySubmitting || !replyContent.trim()} onClick={() => onSubmitReply(comment.id)}>
                {replySubmitting ? <Loader className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </Button>
            </div>
          )}

          {/* Nested Replies */}
          {(comment.replies || []).map((reply) => (
            <div key={reply.id} className="mt-3">
              <CommentCard
                comment={reply}
                depth={depth + 1}
                currentUserId={currentUserId}
                postAuthorId={postAuthorId}
                isPostAuthor={isPostAuthor}
                replyingTo={replyingTo}
                replyContent={replyContent}
                replySubmitting={replySubmitting}
                editingId={editingId}
                editContent={editContent}
                editSubmitting={editSubmitting}
                onStartReply={onStartReply}
                onReplyContentChange={onReplyContentChange}
                onSubmitReply={onSubmitReply}
                onStartEdit={onStartEdit}
                onEditContentChange={onEditContentChange}
                onSubmitEdit={onSubmitEdit}
                onCancelEdit={onCancelEdit}
                onDelete={onDelete}
                onVote={onVote}
                onBestAnswer={onBestAnswer}
                onFlag={onFlag}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
