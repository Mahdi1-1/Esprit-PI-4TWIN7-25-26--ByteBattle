import React from 'react';
import { Link } from 'react-router';
import { ThumbsUp, ThumbsDown, Eye, MessageSquare, Pin, CheckCircle2, Share2 } from 'lucide-react';
import { discussionCategories, type DiscussionPost } from '../data/discussionData';

interface Props {
  post: DiscussionPost;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function DiscussionPostCard({ post }: Props) {
  const cat = discussionCategories.find((c) => c.id === post.category);
  const score = post.upvotes - post.downvotes;
  const discussionLink = post.companyId
    ? `/discussion/${post.id}?companyId=${encodeURIComponent(post.companyId)}`
    : `/discussion/${post.id}`;

  return (
    <div className="theme-card overflow-hidden hover:border-[var(--brand-primary)]/35 transition-colors group">
      <div className="flex">

        {/* ── Vote column ── */}
        <div className="hidden sm:flex flex-col items-center gap-0.5 px-2.5 py-3 bg-[var(--surface-2)] shrink-0 w-12">
          <button
            onClick={(e) => e.preventDefault()}
            className="p-1 rounded hover:bg-[var(--brand-primary)]/15 hover:text-[var(--brand-primary)] text-[var(--text-muted)] transition-colors"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <span
            className={`text-xs font-bold tabular-nums leading-none ${
              score > 0
                ? 'text-[var(--brand-primary)]'
                : score < 0
                ? 'text-[var(--state-error)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {score > 0 ? `+${score}` : score}
          </span>
          <button
            onClick={(e) => e.preventDefault()}
            className="p-1 rounded hover:bg-[var(--state-error)]/10 hover:text-[var(--state-error)] text-[var(--text-muted)] transition-colors"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0 px-4 py-3">

          {/* Meta line */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5 text-xs text-[var(--text-muted)]">
            {/* Author avatar + name */}
            <div className="flex items-center gap-1.5">
              <img
                src={post.author.avatar}
                alt={post.author.username}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full"
              />
              <span className="font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-primary)] cursor-pointer">
                u/{post.author.username}
              </span>
              <span className="bg-[var(--surface-2)] px-1.5 py-0.5 rounded text-[10px]">
                Lv.{post.author.level}
              </span>
            </div>

            <span>·</span>
            <span>{relativeTime(post.createdAt)}</span>

            {/* Category */}
            {cat && cat.id !== 'all' && (
              <>
                <span>·</span>
                <span
                  className="font-semibold"
                  style={{ color: cat.color }}
                >
                  {cat.icon} {cat.label}
                </span>
              </>
            )}

            {/* Pinned / Solved badges */}
            {post.isPinned && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5 text-[var(--brand-secondary)] font-semibold">
                  <Pin className="w-3 h-3" /> Pinned
                </span>
              </>
            )}
            {post.isSolved && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5 text-[var(--state-success)] font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Solved
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <Link to={discussionLink}>
            <h3 className="text-[var(--text-primary)] font-semibold text-base leading-snug
                           group-hover:text-[var(--brand-primary)] transition-colors mb-1.5 line-clamp-2">
              {post.title}
            </h3>
          </Link>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border-default)]"
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-[var(--text-muted)]">+{post.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            {/* Mobile vote */}
            <div className="flex items-center gap-1 sm:hidden mr-2">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span className="font-semibold">{score}</span>
            </div>

            <Link
              to={discussionLink}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-[var(--surface-2)] transition-colors font-semibold"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </Link>

            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded">
              <Eye className="w-3.5 h-3.5" />
              {post.views.toLocaleString()}
            </span>

            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-[var(--surface-2)] transition-colors font-semibold">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
