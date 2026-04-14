import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Layout } from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import {
  Search, Plus, Clock, ThumbsUp, Flame,
  ChevronLeft, ChevronRight, Loader, MessageSquare, LayoutGrid,
  TrendingUp, Filter,
} from 'lucide-react';
import { discussionCategories, type DiscussionPost } from '../data/discussionData';
import { discussionsService } from '../services/discussionsService';
import { profileService } from '../services/profileService';
import { DiscussionPostCard } from '../components/DiscussionPostCard';

const POSTS_PER_PAGE = 10;
type SortOption = 'trending' | 'newest' | 'most-voted';

export function DiscussionPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || undefined;

  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'all',
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [currentPage, setCurrentPage] = useState(1);
  const [discussions, setDiscussions] = useState<DiscussionPost[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (debouncedSearch) params.search = debouncedSearch;
    if (companyId) params.companyId = companyId;
    setSearchParams(params, { replace: true });
  }, [selectedCategory, debouncedSearch, companyId]);

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
          companyId,
        });
        if (cancelled) return;
        if (res?.data?.length) {
          setDiscussions(
            res.data.map((d: any) => ({
              id: d.id,
              companyId: d.companyId,
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
            })),
          );
          setTotalPages(Math.max(1, Math.ceil(res.total / POSTS_PER_PAGE)));
        } else {
          setDiscussions([]);
          setTotalPages(1);
        }
      } catch {
        if (!cancelled) {
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

  const handleCategoryClick = (id: string) => {
    setSelectedCategory(id);
    setCurrentPage(1);
  };

  const activeCat = discussionCategories.find((c) => c.id === selectedCategory);

  return (
    <Layout>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* breadcrumb */}
        <div className="flex items-center gap-2 mb-5">
          <Link
            to="/forum"
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Forum
          </Link>
          <span className="text-[var(--text-muted)] text-xs">/</span>
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {activeCat && activeCat.id !== 'all'
              ? `${activeCat.icon} ${activeCat.label}`
              : 'All Posts'}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">

          {/* ══ MAIN FEED ══ */}
          <div className="flex-1 min-w-0 space-y-3">

            {/* Sort + Create bar */}
            <div className="theme-card px-3 py-2 flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1">
                {(
                  [
                    { key: 'trending',   icon: <Flame className="w-4 h-4" />,       label: 'Hot' },
                    { key: 'newest',     icon: <Clock className="w-4 h-4" />,       label: 'New' },
                    { key: 'most-voted', icon: <TrendingUp className="w-4 h-4" />,  label: 'Top' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                      sortBy === opt.key
                        ? 'bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* New post button */}
              <Link to={companyId ? `/discussion/new?companyId=${encodeURIComponent(companyId)}` : '/discussion/new'}>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--brand-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity shrink-0">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Post</span>
                </button>
              </Link>
            </div>

            {/* Mobile search */}
            <div className="sm:hidden relative flex justify-center">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('discussion.searchPlaceholder')}
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)]
                       rounded-[var(--radius-md)] text-sm text-[var(--text-primary)]
                       placeholder:text-[var(--text-muted)] focus:outline-none
                       focus:border-[var(--brand-primary)] transition-colors text-center"
                />
              </div>
            </div>

            {/* Posts list */}
            <div className="space-y-2">
              {loading ? (
                <div className="theme-card py-16 text-center">
                  <Loader className="w-7 h-7 mx-auto animate-spin text-[var(--brand-primary)] mb-3" />
                  <p className="text-sm text-[var(--text-muted)]">Loading…</p>
                </div>
              ) : discussions.length === 0 ? (
                <div className="theme-card py-16 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
                  <p className="font-semibold text-[var(--text-primary)] mb-1">{t('discussion.noResults')}</p>
                  <p className="text-sm text-[var(--text-muted)] mb-5">Be the first to start a discussion.</p>
                  <Link to={companyId ? `/discussion/new?companyId=${encodeURIComponent(companyId)}` : '/discussion/new'}>
                    <button className="px-5 py-2 rounded-full bg-[var(--brand-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity">
                      + Create Post
                    </button>
                  </Link>
                </div>
              ) : (
                discussions.map((post) => <DiscussionPostCard key={post.id} post={post} />)
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-secondary)]
                             hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded text-sm font-semibold transition-colors ${
                      page === currentPage
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-secondary)]
                             hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ══ RIGHT SIDEBAR ══ */}
          <aside className="lg:w-64 shrink-0 space-y-3">

            {/* Filter by category */}
            <div className="theme-card overflow-hidden">
              <div className="px-3 py-2.5 border-b border-[var(--border-default)] flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                  Filter by topic
                </span>
              </div>
              <div className="py-1">
                {discussionCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                      selectedCategory === cat.id
                        ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <span className="text-base w-5 text-center leading-none">{cat.icon}</span>
                    <span className="flex-1">{cat.label}</span>
                    {selectedCategory === cat.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="theme-card px-3 py-3">
              <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide mb-2">
                Posting Rules
              </p>
              <ul className="space-y-1.5 text-xs text-[var(--text-muted)]">
                {[
                  'Be respectful & constructive',
                  'No spam or self-promotion',
                  'Keep topics coding-related',
                  'Mark posts as solved',
                  'Search before posting',
                ].map((rule, i) => (
                  <li key={rule} className="flex gap-2">
                    <span className="font-bold text-[var(--brand-primary)] shrink-0">{i + 1}.</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

          </aside>
        </div>
      </div>
    </Layout>
  );
}
