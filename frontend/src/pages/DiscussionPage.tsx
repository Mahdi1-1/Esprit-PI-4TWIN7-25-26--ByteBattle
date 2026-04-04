import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useLanguage } from '../context/LanguageContext';
import {
  MessageSquare, ThumbsUp, ThumbsDown, Eye, Pin, CheckCircle2,
  Search, Filter, Plus, TrendingUp, Clock, Flame, ChevronLeft, ChevronRight,
  Tag, Loader,
} from 'lucide-react';
import {
  discussionCategories,
  type DiscussionPost,
} from '../data/discussionData';
import { discussionsService } from '../services/discussionsService';
import { profileService } from '../services/profileService';

const POSTS_PER_PAGE = 5;

type SortOption = 'trending' | 'newest' | 'most-voted';

export function DiscussionPage() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [currentPage, setCurrentPage] = useState(1);
  const [discussions, setDiscussions] = useState<DiscussionPost[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Real stats & tags
  const [stats, setStats] = useState({ totalPosts: 0, activeUsers: 0, solvedThreads: 0, thisWeek: 0 });
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);

  // Debounce search input — wait 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch stats and popular tags once
  useEffect(() => {
    discussionsService.getStats().then(setStats).catch(() => {});
    discussionsService.getPopularTags().then((tags) => {
      if (Array.isArray(tags)) setPopularTags(tags);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchDiscussions = async () => {
      setLoading(true);
      try {
        const sortMap: Record<SortOption, string> = {
          trending: 'popular',
          newest: 'newest',
          'most-voted': 'most-voted',
        };
        const res = await discussionsService.getAll({
          page: currentPage,
          limit: POSTS_PER_PAGE,
          search: debouncedSearch || undefined,
          tags: selectedCategory !== 'all' ? selectedCategory : undefined,
          sort: sortMap[sortBy],
        });
        if (cancelled) return;
        if (res?.data?.length) {
          setDiscussions(res.data.map((d: any) => ({
            id: d.id,
            title: d.title,
            content: d.content,
            author: {
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
            isPinned: d.isPinned || false,
            isSolved: d.isSolved || false,
          })));
          setTotalPages(Math.max(1, Math.ceil(res.total / POSTS_PER_PAGE)));
        } else {
          setDiscussions([]);
          setTotalPages(1);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load discussions:', err);
          setDiscussions([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDiscussions();
    return () => { cancelled = true; };
  }, [currentPage, debouncedSearch, selectedCategory, sortBy]);

  const paged = discussions;

  const categoryColorMap: Record<string, string> = {};
  discussionCategories.forEach((c) => { categoryColorMap[c.id] = c.color; });

  return (
    <Layout>
      <Navbar />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-brand-text font-title">{t('discussion.title')}</h1>
            <p className="text-[var(--text-muted)] mt-1">{t('discussion.subtitle')}</p>
          </div>
            <Link to="/discussion/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4" />
              {t('discussion.newPost')}
            </Button>
            </Link>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('discussion.totalPosts'), value: stats.totalPosts.toLocaleString(), icon: <MessageSquare className="w-5 h-5" /> },
            { label: t('discussion.activeUsers'), value: stats.activeUsers.toLocaleString(), icon: <TrendingUp className="w-5 h-5" /> },
            { label: t('discussion.solvedThreads'), value: stats.solvedThreads.toLocaleString(), icon: <CheckCircle2 className="w-5 h-5" /> },
            { label: t('discussion.thisWeek'), value: `+${stats.thisWeek}`, icon: <Flame className="w-5 h-5" /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className="theme-card p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)]">
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar – Categories */}
          <aside className="lg:w-64 shrink-0 space-y-4">
            <div className="theme-card p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('discussion.categories')}</h3>
              <div className="space-y-1">
                <button
                  onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors ${selectedCategory === 'all'
                      ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                    }`}
                >
                  💬 {t('discussion.allPosts')}
                </button>
                {discussionCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors ${selectedCategory === cat.id
                        ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                      }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="theme-card p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('discussion.popularTags')}</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.length > 0 ? popularTags.map((item) => (
                  <button
                    key={item.tag}
                    onClick={() => { setSearchQuery(item.tag); setCurrentPage(1); }}
                    className="px-2 py-1 text-xs rounded-[var(--radius-sm)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] transition-colors"
                  >
                    <Tag className="w-3 h-3 inline mr-1" />{item.tag}
                    <span className="ml-1 text-[var(--text-muted)]">({item.count})</span>
                  </button>
                )) : (
                  <span className="text-xs text-[var(--text-muted)]">No tags yet</span>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Search & Sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('discussion.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
                />
              </div>
              <div className="flex gap-2">
                {([
                  { key: 'trending', icon: <Flame className="w-4 h-4" />, label: t('discussion.trending') },
                  { key: 'newest', icon: <Clock className="w-4 h-4" />, label: t('discussion.newest') },
                  { key: 'most-voted', icon: <ThumbsUp className="w-4 h-4" />, label: t('discussion.mostVoted') },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors whitespace-nowrap ${sortBy === opt.key
                        ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)] font-medium'
                        : 'bg-[var(--surface-1)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--brand-primary)]'
                      }`}
                  >
                    {opt.icon}
                    <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-3">
              {loading ? (
                <div className="theme-card p-12 text-center">
                  <Loader className="w-8 h-8 mx-auto animate-spin text-[var(--brand-primary)] mb-3" />
                  <p className="text-[var(--text-muted)]">Loading discussions...</p>
                </div>
              ) : paged.length === 0 ? (
                <div className="theme-card p-12 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
                  <p className="text-[var(--text-muted)]">{t('discussion.noResults')}</p>
                </div>
              ) : (
                paged.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${page === currentPage
                        ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ───── Post Card Component ───── */

function PostCard({ post, ...rest }: { post: DiscussionPost } & React.HTMLAttributes<HTMLDivElement>) {
  const cat = discussionCategories.find((c) => c.id === post.category);

  return (
    <Link to={`/discussion/${post.id}`} className="block">
      <div className="theme-card p-6 hover:border-[var(--brand-primary)]/40 transition-all group">
        <div className="flex gap-4">
          {/* Vote Column */}
          <div className="hidden sm:flex flex-col items-center gap-1 min-w-[50px]">
            <button
              onClick={(e) => e.preventDefault()}
              className="p-1 rounded hover:bg-[var(--state-success)]/10 text-[var(--text-muted)] hover:text-[var(--state-success)] transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-[var(--text-primary)]">{post.upvotes - post.downvotes}</span>
            <button
              onClick={(e) => e.preventDefault()}
              className="p-1 rounded hover:bg-[var(--state-error)]/10 text-[var(--text-muted)] hover:text-[var(--state-error)] transition-colors"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {post.isPinned && (
                <Pin className="w-4 h-4 text-[var(--brand-secondary)] rotate-45" />
              )}
              {post.isSolved && (
                <CheckCircle2 className="w-4 h-4 text-[var(--state-success)]" />
              )}
              <h3 className="text-[var(--text-primary)] font-semibold group-hover:text-[var(--brand-primary)] transition-colors truncate">
                {post.title}
              </h3>
            </div>

            <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3">
              {post.content.replace(/[#*`\n]/g, ' ').slice(0, 150)}...
            </p>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <img src={post.author.avatar} alt={post.author.username} referrerPolicy="no-referrer" className="w-5 h-5 rounded-full" />
                  <span className="text-xs text-[var(--text-secondary)]">{post.author.username}</span>
                  <span className="text-xs text-[var(--text-muted)]">Lv.{post.author.level}</span>
                </div>

                {/* Category */}
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

                {/* Tags */}
                <div className="hidden md:flex items-center gap-1">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span key={tag}><Badge variant="default">{tag}</Badge></span>
                  ))}
                  {post.tags.length > 2 && (
                    <span className="text-xs text-[var(--text-muted)]">+{post.tags.length - 2}</span>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{post.views}</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{post.commentCount}</span>
                <span>{new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
