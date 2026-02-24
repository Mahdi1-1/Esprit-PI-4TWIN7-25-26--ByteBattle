import React, { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Eye, Pin,
  CheckCircle2, Share2, Bookmark, Flag, Clock, Send, Tag,
} from 'lucide-react';
import { mockDiscussions, discussionCategories, type DiscussionComment } from '../data/discussionData';

export function DiscussionDetailPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const post = mockDiscussions.find((p) => p.id === id);
  if (!post) {
    return (
      <Layout>
        <Navbar />
        <div className="w-full px-4 sm:px-6 lg:px-10 py-20 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('discussion.notFound')}</h2>
          <Link to="/discussion" className="text-[var(--brand-primary)] hover:underline mt-4 inline-block">
            ← {t('discussion.backToForum')}
          </Link>
        </div>
      </Layout>
    );
  }

  const cat = discussionCategories.find((c) => c.id === post.category);

  return (
    <Layout>
      <Navbar />

      <div className="max-w-[960px] mx-auto px-6 lg:px-10 py-8">
        {/* Back Link */}
        <Link
          to="/discussion"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('discussion.backToForum')}
        </Link>

        {/* Post Header */}
        <div className="theme-card p-6 mb-6">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {post.isPinned && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)]">
                <Pin className="w-3 h-3 rotate-45" /> Pinned
              </span>
            )}
            {post.isSolved && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--state-success)]/10 text-[var(--state-success)]">
                <CheckCircle2 className="w-3 h-3" /> Solved
              </span>
            )}
            {cat && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `color-mix(in srgb, ${cat.color} 15%, transparent)`,
                  color: cat.color,
                }}
              >
                {cat.icon} {cat.label}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{post.title}</h1>

          {/* Author Info */}
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[var(--border-default)]">
            <img src={post.author.avatar} alt={post.author.username} className="w-10 h-10 rounded-full border-2 border-[var(--brand-primary)]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--text-primary)]">{post.author.username}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">Lv.{post.author.level}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{post.createdAt}</span>
                {post.updatedAt !== post.createdAt && <span>· Updated {post.updatedAt}</span>}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[var(--border-default)]">
            <Tag className="w-4 h-4 text-[var(--text-muted)]" />
            {post.tags.map((tag) => (
              <span key={tag}>
                <Badge variant="default">{tag}</Badge>
              </span>
            ))}
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-default)]">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--state-success)] transition-colors">
                <ThumbsUp className="w-4 h-4" /> {post.upvotes}
              </button>
              <button className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--state-error)] transition-colors">
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
              <button className="p-2 text-[var(--text-muted)] hover:text-[var(--state-error)] hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors">
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[var(--brand-primary)]" />
            {post.commentCount} {t('discussion.comments')}
          </h2>

          {/* Reply Box */}
          <div className="theme-card p-4">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={t('discussion.writeComment')}
              rows={3}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors resize-none"
            />
            <div className="flex justify-end mt-2">
              <Button variant="primary" size="sm">
                <Send className="w-4 h-4" />
                {t('discussion.postComment')}
              </Button>
            </div>
          </div>

          {/* Comment List */}
          {post.comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              isReplyingTo={replyingTo === comment.id}
              onReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            />
          ))}

          {post.comments.length === 0 && (
            <div className="theme-card p-8 text-center">
              <MessageSquare className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-[var(--text-muted)]">{t('discussion.noComments')}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

/* ───── Comment Card ───── */

function CommentCard({
  comment,
  isReplyingTo,
  onReply,
  depth = 0,
  ...rest
}: {
  comment: DiscussionComment;
  isReplyingTo: boolean;
  onReply: () => void;
  depth?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`theme-card p-4 ${depth > 0 ? 'ml-8 border-l-2 border-[var(--brand-primary)]/20' : ''} ${
        comment.isAccepted ? 'ring-1 ring-[var(--state-success)]/30' : ''
      }`}
    >
      <div className="flex gap-3">
        <img src={comment.author.avatar} alt={comment.author.username} className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-[var(--text-primary)]">{comment.author.username}</span>
            <span className="text-xs text-[var(--text-muted)]">Lv.{comment.author.level}</span>
            <span className="text-xs text-[var(--text-muted)]">· {comment.createdAt}</span>
            {comment.isAccepted && (
              <span className="flex items-center gap-1 text-xs text-[var(--state-success)]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
              </span>
            )}
          </div>

          <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap mb-2">
            {comment.content}
          </p>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--state-success)] transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" /> {comment.upvotes}
            </button>
            <button className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--state-error)] transition-colors">
              <ThumbsDown className="w-3.5 h-3.5" /> {comment.downvotes}
            </button>
            <button
              onClick={onReply}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
            >
              Reply
            </button>
          </div>

          {isReplyingTo && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Write a reply..."
                className="flex-1 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]"
              />
              <Button variant="primary" size="sm">
                <Send className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies?.map((reply) => (
            <div key={reply.id} className="mt-3">
              <CommentCard comment={reply} isReplyingTo={false} onReply={() => {}} depth={depth + 1} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
