import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
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
    createdAt: c.createdAt,
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
  const { user } = useAuth();
  const { t } = useLanguage();

  const [post, setPost] = useState<DiscussionPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const fetchPost = useCallback(async () => {
    try {
      const d = await discussionsService.getById(id!);
      if (d) {
        setPost({
          id: d.id,
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
          createdAt: d.createdAt,
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
  }, [id, user?.id]);

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
        <div className="w-full px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('discussion.notFound') || "Discussion not found"}</h2>
          <Link to="/discussion" className="text-[var(--brand-primary)] hover:underline mt-4 inline-block font-medium">
            ← {t('discussion.backToForum') || "Back to Forum"}
          </Link>
        </div>
      </Layout>
    );
  }

  const cat = discussionCategories.find((c) => c.id === post.category);
  const isAuthor = !!(user && user.id === (post.author as any).id);

  /* ── Post actions ── */
  const handleToggleSolved = async () => {
    try { await discussionsService.solve(post.id); setPost({ ...post, isSolved: !post.isSolved }); } catch (err) { console.error(err); }
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
      try { await discussionsService.delete(post.id); navigate('/discussion'); } catch (err) { console.error(err); }
    }
  };

  /* ── Comment actions ── */
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try { await discussionsService.addComment(post.id, { content: newComment.trim() }); setNewComment(''); await fetchPost(); }
    catch (err) { console.error('Comment failed:', err); }
    finally { setSubmitting(false); }
  };
  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim() || !user) return;
    setReplySubmitting(true);
    try {
      await discussionsService.addComment(post.id, { content: replyContent.trim(), parentCommentId });
      setReplyContent(''); setReplyingTo(null); await fetchPost();
    } catch (err) { console.error('Reply failed:', err); }
    finally { setReplySubmitting(false); }
  };
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    setEditSubmitting(true);
    try {
      await discussionsService.updateComment(commentId, editContent.trim());
      const updateInTree = (comments: DiscussionComment[]): DiscussionComment[] =>
        comments.map(c => c.id === commentId ? { ...c, content: editContent.trim() } : { ...c, replies: updateInTree(c.replies || []) });
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
        comments.filter(c => c.id !== commentId).map(c => ({ ...c, replies: removeFromTree(c.replies || []) }));
      setPost({ ...post, comments: removeFromTree(post.comments || []), commentCount: post.commentCount - 1 });
    } catch (err) { console.error('Delete failed:', err); }
  };
  const handleVoteComment = async (commentId: string, type: 'upvote' | 'downvote') => {
    if (!user) { alert('Please log in to vote'); return; }
    try {
      const { userVote: newVote, upvotes: newUp, downvotes: newDown } = await discussionsService.voteComment(commentId, type);
      const updateInTree = (comments: DiscussionComment[]): DiscussionComment[] =>
        comments.map(c => c.id === commentId ? { ...c, upvotes: newUp, downvotes: newDown, userVote: newVote ?? null } : { ...c, replies: updateInTree(c.replies || []) });
      setPost({ ...post, comments: updateInTree(post.comments || []) });
    } catch (err) { console.error('Vote comment failed:', err); }
  };
  const handleToggleBestAnswer = async (commentId: string) => {
    if (!user || !isAuthor) return;
    try {
      await discussionsService.bestAnswer(commentId);
      const toggleInTree = (comments: DiscussionComment[]): DiscussionComment[] =>
        comments.map(c => {
          if (c.id === commentId) return { ...c, isAccepted: !c.isAccepted };
          if (c.isAccepted && c.id !== commentId) return { ...c, isAccepted: false };
          return { ...c, replies: toggleInTree(c.replies || []) };
        });
      setPost({ ...post, comments: toggleInTree(post.comments || []), isSolved: true } as any);
    } catch (err) { console.error('Toggle best answer failed:', err); }
  };
  const handleFlagDiscussion = async () => {
    if (!user) return;
    if (window.confirm('Report this post as inappropriate?')) {
      try { await discussionsService.flagDiscussion(post.id); alert('Post reported. Thank you for your feedback.'); }
      catch (err) { console.error('Flag failed:', err); }
    }
  };
  const handleFlagComment = async (commentId: string) => {
    if (!user) return;
    if (window.confirm('Report this comment as inappropriate?')) {
      try { await discussionsService.flagComment(commentId); alert('Comment reported. Thank you for your feedback.'); }
      catch (err) { console.error('Flag failed:', err); }
    }
  };

  const sortedComments = sortComments(post.comments || [], sortMode);

  return (
    <Layout>
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">

        {/* Back Link */}
        <Link
          to="/discussion"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('discussion.backToForum') || "Back to Forum"}
        </Link>

        {/* ── Post Card ── */}
        <div className="relative overflow-hidden rounded-2xl mb-10 border border-[var(--border-default)] bg-[var(--surface-1)] shadow-sm">
          
          <div className="relative z-10 p-6 sm:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-4">
                  {post.isPinned && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  {post.isSolved && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20">
                      <CheckCircle2 className="w-3 h-3" /> {t('discussion.solved') || "Solved"}
                    </span>
                  )}
                  {cat && cat.id !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                      {cat.icon} {cat.label}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
                  {post.title}
                </h1>
              </div>

              {isAuthor && (
                <div className="flex items-center gap-1 shrink-0 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)]">
                  <button onClick={handleToggleSolved}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-green-500 hover:bg-green-500/10 transition-colors"
                    title={post.isSolved ? 'Unmark solved' : 'Mark as solved'}>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <Link to={`/discussion/edit/${post.id}`}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 transition-colors block"
                    title="Edit discussion">
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button onClick={handleDelete}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete discussion">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Author */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border-default)]">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--border-default)] bg-[var(--surface-2)]">
                  <img src={post.author.avatar} alt={post.author.username} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold bg-[var(--surface-3)] text-[var(--text-primary)] border border-[var(--border-default)]">
                  {post.author.level}
                </div>
              </div>
              <div>
                <span className="font-semibold text-base text-[var(--text-primary)] hover:underline cursor-pointer transition-all">{post.author.username}</span>
                <div className="flex items-center gap-3 text-xs mt-1 text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5" /> {formatDate(post.createdAt)}
                  </span>
                  {post.updatedAt && post.updatedAt !== post.createdAt && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                      <span className="flex items-center gap-1 font-medium">
                        <Pencil className="w-3 h-3" /> edited {formatDate(post.updatedAt)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                      <button onClick={handleOpenRevisions}
                        className="flex items-center gap-1 font-semibold hover:text-[var(--text-primary)] transition-colors">
                        <History className="w-3.5 h-3.5" /> view edits
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap mb-8 text-[var(--text-primary)]">
              {post.content}
            </p>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag) => (
                  <span key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface-2)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                    <Tag className="w-3 h-3" /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-[var(--border-default)]">
              <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)] rounded-lg border border-[var(--border-default)]">
                <button onClick={() => handleVote('upvote')} disabled={isAuthor}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold transition-all disabled:opacity-50 ${
                    post.userVote === 'upvote' ? 'text-green-500 bg-green-500/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]'
                  }`}>
                  <ThumbsUp className="w-4 h-4" /> {post.upvotes}
                </button>
                <button onClick={() => handleVote('downvote')} disabled={isAuthor}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold transition-all disabled:opacity-50 ${
                    post.userVote === 'downvote' ? 'text-red-500 bg-red-500/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]'
                  }`}>
                  <ThumbsDown className="w-4 h-4" /> {post.downvotes}
                </button>
                <div className="w-px h-5 mx-1 bg-[var(--border-default)]" />
                <span className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-[var(--text-muted)] cursor-default">
                  <Eye className="w-4 h-4" /> {post.views}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <button className="p-2 rounded-lg hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-all" title="Bookmark">
                  <Bookmark className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-all" title="Share">
                  <Share2 className="w-4 h-4" />
                </button>
                {user && !isAuthor && (
                  <button onClick={handleFlagDiscussion} className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all" title="Report post">
                    <Flag className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Comments Section ── */}
        <div className="space-y-6">
          {/* Header + Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                <MessageSquare className="w-5 h-5" />
              </div>
              {post.commentCount} {t('discussion.comments') || "Comments"}
            </h2>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)] w-full sm:w-auto">
              {(['newest', 'oldest', 'top'] as SortMode[]).map((m) => (
                <button key={m} onClick={() => setSortMode(m)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                    sortMode === m ? 'bg-[var(--surface-1)] text-[var(--brand-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* New Comment Box */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-default)] focus-within:border-[var(--brand-primary)] transition-all shadow-sm">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? (t('discussion.writeComment') || "Write a comment...") : 'Log in to comment…'}
              disabled={!user}
              rows={3}
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none disabled:opacity-50 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] p-0"
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border-default)]">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {user ? (
                  <span className="flex items-center gap-2">
                    <img src={typeof user.avatar === 'string' ? user.avatar : ''} className="w-5 h-5 rounded-full border border-[var(--border-default)]" alt="" />
                    Commenting as <strong className="text-[var(--text-primary)] text-xs">{user.username}</strong>
                  </span>
                ) : 'Sign in to join the conversation'}
              </span>
              <button
                disabled={!user || submitting || !newComment.trim()}
                onClick={handleSubmitComment}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-semibold transition-all hover:brightness-110 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t('discussion.postComment') || "Post Comment"}
              </button>
            </div>
          </div>

          {/* Comment List */}
          <div className="space-y-4 pt-2">
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
                onStartReply={(cid) => { setReplyingTo(replyingTo === cid ? null : cid); setReplyContent(''); }}
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
              <div className="p-12 text-center bg-[var(--surface-1)] border border-[var(--border-default)] rounded-2xl shadow-sm">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[var(--surface-2)] border border-[var(--border-default)]">
                  <MessageSquare className="w-6 h-6 text-[var(--text-muted)]" />
                </div>
                <p className="text-lg font-bold text-[var(--text-primary)] mb-1">No comments yet</p>
                <p className="text-sm font-medium text-[var(--text-secondary)]">{t('discussion.noComments') || "Be the first to share your thoughts!"}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revisions Modal */}
      {showRevisions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--surface-2)]">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <History className="w-4 h-4 text-[var(--text-secondary)]" /> Edit History
              </h3>
              <button onClick={() => setShowRevisions(false)} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {revisionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
                </div>
              ) : revisions.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No edit history found</p>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-sm font-bold text-green-500">
                      <CheckCircle2 className="w-4 h-4" /> Current version
                    </div>
                    <p className="text-xs mt-1 text-[var(--text-secondary)] font-medium">{formatDate(post.updatedAt || post.createdAt)}</p>
                  </div>

                  {revisions.map((rev, idx) => {
                    const isExpanded = expandedRevision === rev.id;
                    return (
                      <div key={rev.id} className="border border-[var(--border-default)] bg-[var(--surface-1)] rounded-xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => setExpandedRevision(isExpanded ? null : rev.id)}
                          className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-[var(--surface-2)]">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold bg-[var(--surface-3)] border border-[var(--border-default)] text-[var(--text-secondary)] shrink-0">
                              v{revisions.length - idx}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[var(--text-primary)] truncate">{rev.title}</p>
                              <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">
                                by {rev.editor?.username || 'Unknown'} • {formatDate(rev.createdAt)}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[var(--text-secondary)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-[var(--border-default)] bg-[var(--surface-2)] space-y-4 pt-4">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Title</span>
                              <p className="text-sm font-medium text-[var(--text-primary)] mt-1">{rev.title}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Content</span>
                              <p className="text-sm mt-1 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                                {rev.content}
                              </p>
                            </div>
                            {rev.tags && rev.tags.length > 0 && (
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Tags</span>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {rev.tags.map((tag: string) => (
                                    <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--surface-2)] flex justify-end">
              <Button variant="ghost" onClick={() => setShowRevisions(false)}>Close</Button>
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
  comment, depth, currentUserId, postAuthorId, isPostAuthor,
  replyingTo, replyContent, replySubmitting, editingId, editContent, editSubmitting,
  onStartReply, onReplyContentChange, onSubmitReply, onStartEdit, onEditContentChange,
  onSubmitEdit, onCancelEdit, onDelete, onVote, onBestAnswer, onFlag,
}: CommentCardProps) {
  const isCommentAuthor = !!(currentUserId && comment.author.id && currentUserId === comment.author.id);
  const isEditing = editingId === comment.id;
  const isReplying = replyingTo === comment.id;

  return (
    <div className={`relative transition-all duration-300 ${depth > 0 ? 'ml-6 sm:ml-10 mt-3' : 'mt-4'}`}>
      {/* Thread line */}
      {depth > 0 && (
        <div className="absolute -left-6 sm:-left-10 top-0 w-6 sm:w-10 h-6 border-l-2 border-b-2 border-[var(--border-default)] rounded-bl-xl pointer-events-none" />
      )}

      <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        comment.isAccepted ? 'bg-green-500/5 border-green-500/20 shadow-sm' : 'bg-[var(--surface-1)] border-[var(--border-default)] shadow-sm'
      }`}>
        <div className="flex gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <img src={comment.author.avatar} alt={comment.author.username} referrerPolicy="no-referrer"
              className={`w-10 h-10 rounded-full border ${comment.isAccepted ? 'border-green-500/50' : 'border-[var(--border-default)] bg-[var(--surface-2)]'}`} />
            {comment.isAccepted && (
              <div className="absolute -bottom-1 -right-1 rounded-full bg-[var(--surface-1)] p-0.5 text-green-500 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" fill="currentColor" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Author row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-bold text-sm text-[var(--text-primary)] hover:underline cursor-pointer">{comment.author.username}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                Lvl {comment.author.level}
              </span>
              <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 ml-1">
                <Clock className="w-3.5 h-3.5" /> {formatDate(comment.createdAt)}
              </span>
              {comment.isAccepted && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 ml-1">
                  <CheckCircle2 className="w-3 h-3" /> Best Answer
                </span>
              )}
            </div>

            {/* Content or edit */}
            {isEditing ? (
              <div className="mb-4 mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => onEditContentChange(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl p-3 text-sm bg-[var(--surface-2)] border border-[var(--brand-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]/50 resize-none"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="ghost" size="sm" onClick={onCancelEdit}>Cancel</Button>
                  <Button variant="primary" size="sm" disabled={editSubmitting} onClick={() => onSubmitEdit(comment.id)}>
                    {editSubmitting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap mb-4 text-[var(--text-primary)]">
                {comment.content}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 select-none">
              <div className="flex items-center rounded-lg p-1 bg-[var(--surface-2)] border border-[var(--border-default)]">
                <button onClick={() => onVote(comment.id, 'upvote')} disabled={isCommentAuthor}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-semibold transition-all disabled:opacity-50 ${
                    comment.userVote === 'upvote' ? 'text-green-500 bg-green-500/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]'
                  }`}>
                  <ThumbsUp className="w-3.5 h-3.5" /> <span>{comment.upvotes}</span>
                </button>
                <div className="w-px h-3 mx-1 bg-[var(--border-default)]" />
                <button onClick={() => onVote(comment.id, 'downvote')} disabled={isCommentAuthor}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-semibold transition-all disabled:opacity-50 ${
                    comment.userVote === 'downvote' ? 'text-red-500 bg-red-500/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]'
                  }`}>
                  <ThumbsDown className="w-3.5 h-3.5" /> <span>{comment.downvotes}</span>
                </button>
              </div>

              {depth < 1 && (
                <button onClick={() => onStartReply(comment.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    isReplying ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/25' : 'text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
                  }`}>
                  <MessageSquare className="w-3.5 h-3.5" /> Reply
                </button>
              )}

              {isCommentAuthor && !isEditing && (
                <div className="flex items-center gap-1 ml-auto sm:ml-0">
                  <button onClick={() => onStartEdit(comment.id, comment.content)}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(comment.id)}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {isPostAuthor && !isCommentAuthor && !comment.isAccepted && (
                <button onClick={() => onBestAnswer(comment.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-transparent text-[var(--text-secondary)] hover:text-green-500 hover:bg-green-500/10 hover:border-green-500/20 transition-all ml-auto sm:ml-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark Best
                </button>
              )}

              {!isCommentAuthor && !isPostAuthor && (
                <button onClick={() => onFlag(comment.id)}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-all ml-auto">
                  <Flag className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Reply input */}
            {isReplying && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)] transition-all">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => onReplyContentChange(e.target.value)}
                  placeholder={`Reply to ${comment.author.username}…`}
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none px-2"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmitReply(comment.id); } }}
                  autoFocus
                />
                <button disabled={replySubmitting || !replyContent.trim()} onClick={() => onSubmitReply(comment.id)}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-110">
                  {replySubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send</>}
                </button>
              </div>
            )}

            {/* Nested replies */}
            {(comment.replies || []).length > 0 && (
              <div className="mt-4 space-y-4">
                {(comment.replies || []).map((reply) => (
                  <CommentCard
                    key={reply.id}
                    comment={reply} depth={depth + 1} currentUserId={currentUserId}
                    postAuthorId={postAuthorId} isPostAuthor={isPostAuthor}
                    replyingTo={replyingTo} replyContent={replyContent} replySubmitting={replySubmitting}
                    editingId={editingId} editContent={editContent} editSubmitting={editSubmitting}
                    onStartReply={onStartReply} onReplyContentChange={onReplyContentChange}
                    onSubmitReply={onSubmitReply} onStartEdit={onStartEdit} onEditContentChange={onEditContentChange}
                    onSubmitEdit={onSubmitEdit} onCancelEdit={onCancelEdit} onDelete={onDelete}
                    onVote={onVote} onBestAnswer={onBestAnswer} onFlag={onFlag}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}