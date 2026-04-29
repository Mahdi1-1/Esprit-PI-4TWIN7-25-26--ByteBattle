import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Eye, ThumbsUp, ThumbsDown, Clock, Pin, CheckCircle2, Share2 } from 'lucide-react';
import { discussionCategories, type DiscussionPost } from '../data/discussionData';

interface DiscussionPostCardProps {
  post: DiscussionPost & {
    author: { username: string; avatar: string; level: number };
    commentCount: number;
    userVote?: 'upvote' | 'downvote' | null;
  };
}

export function DiscussionPostCard({ post }: DiscussionPostCardProps) {
  const cat = discussionCategories.find((c) => c.id === post.category);
  
  const relativeTime = (date: any) => {
    try {
      const msPerMinute = 60 * 1000;
      const msPerHour = msPerMinute * 60;
      const msPerDay = msPerHour * 24;
      const msPerMonth = msPerDay * 30;
      const elapsed = Date.now() - new Date(date).getTime();
      
      if (elapsed < msPerMinute) return Math.round(elapsed/1000) + ' seconds ago';
      if (elapsed < msPerHour) return Math.round(elapsed/msPerMinute) + ' mins ago';
      if (elapsed < msPerDay) return Math.round(elapsed/msPerHour) + ' hours ago';
      if (elapsed < msPerMonth) return Math.round(elapsed/msPerDay) + ' days ago';
      return Math.round(elapsed/msPerMonth) + ' months ago';
    } catch {
      return 'recently';
    }
  };

  const score = post.upvotes - post.downvotes;

  return (
    <div className="relative group rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)] hover:border-[var(--brand-primary)]/40 transition-all duration-300 flex overflow-hidden hover:shadow-sm">
      {/* Accent bars */}
      {post.isSolved && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 rounded-l-xl" />
      )}
      {post.isPinned && !post.isSolved && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500 rounded-l-xl" />
      )}

      {/* ── Vote column ── */}
      <div className="hidden sm:flex flex-col items-center gap-1.5 px-3 py-4 bg-[var(--surface-2)]/30 border-r border-[var(--border-default)] shrink-0 w-14 group-hover:bg-[var(--surface-2)] transition-colors">
        <button
          onClick={(e) => e.preventDefault()}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <span
          className={`text-sm font-bold tabular-nums leading-none ${
            score > 0
              ? 'text-[var(--state-success)]'
              : score < 0
              ? 'text-[var(--state-error)]'
              : 'text-[var(--text-muted)]'
          }`}
        >
          {score > 0 ? `+${score}` : score}
        </span>
        <button
          onClick={(e) => e.preventDefault()}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0 p-4 sm:p-5">
        
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2 pr-2">
            <img
              src={post.author.avatar}
              alt={post.author.username}
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full border border-[var(--border-default)]"
            />
            <span className="font-semibold text-[var(--text-primary)]">
              {post.author.username}
            </span>
          </div>
          
          <span className="hidden sm:inline text-[var(--border-default)]">•</span>
          <span className="font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {relativeTime(post.createdAt)}
          </span>

          {cat && cat.id !== 'all' && (
            <>
              <span className="font-semibold px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-default)] flex items-center gap-1 ml-1 cursor-default">
                <span className="opacity-70 text-[10px]">{cat.icon}</span> {cat.label}
              </span>
            </>
          )}

          {/* Status badges */}
          {post.isPinned && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-500 ml-auto sm:ml-1 border border-orange-500/20">
              <Pin className="w-3 h-3" /> Pinned
            </span>
          )}
          {post.isSolved && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 ml-auto sm:ml-1 border border-green-500/20">
              <CheckCircle2 className="w-3 h-3" /> Solved
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/discussion/${post.id}`} className="block mb-2 group-hover:opacity-90">
          <h3 className="text-[var(--text-primary)] text-base sm:text-lg font-semibold leading-snug line-clamp-2 pr-4 transition-colors group-hover:text-[var(--brand-primary)]">
            {post.title}
          </h3>
        </Link>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border-default)] text-[var(--text-secondary)]"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 4 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border-default)] border-dashed text-[var(--text-muted)]">
                +{post.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] mt-2">
          {/* Mobile vote */}
          <div className="flex items-center gap-1.5 sm:hidden mr-2 bg-[var(--surface-2)] px-2 py-1 rounded-md border border-[var(--border-default)]">
            <ThumbsUp className="w-3 h-3" />
            <span className="font-bold">{score}</span>
          </div>

          <Link
            to={`/discussion/${post.id}#comments`}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[var(--surface-2)] transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 opacity-70" />
            <span className={post.commentCount > 0 ? "font-semibold text-[var(--text-primary)]" : ""}>
              {post.commentCount} comments
            </span>
          </Link>

          <span className="flex items-center gap-1.5 px-2 py-1.5 cursor-default opacity-80">
            <Eye className="w-3.5 h-3.5 opacity-70" />
            {post.views.toLocaleString()}
          </span>

          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[var(--surface-2)] transition-all ml-auto">
            <Share2 className="w-3.5 h-3.5 opacity-70" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}