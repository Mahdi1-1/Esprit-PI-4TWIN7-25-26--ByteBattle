import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import {
  Search, Plus, Clock, ThumbsUp, Flame,
  ChevronLeft, ChevronRight, Loader, MessageSquare, LayoutGrid,
  TrendingUp, Filter, Hash,
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
    setSearchParams(params, { replace: true });
  }, [selectedCategory, debouncedSearch]);

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
          setDiscussions(
            res.data.map((d: any) => ({
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

  const sortOpts = [
    { key: 'trending' as const,   icon: <Flame className="w-4 h-4" />,      label: 'Hot'  },
    { key: 'newest' as const,     icon: <Clock className="w-4 h-4" />,      label: 'New'  },
    { key: 'most-voted' as const, icon: <TrendingUp className="w-4 h-4" />, label: 'Top'  },
  ];

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">

        {/* breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            to="/forum"
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
          >
            <LayoutGrid className="w-4 h-4" /> Forum
          </Link>
          <span className="text-[var(--border-default)]">/</span>
          <span className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]">
            {activeCat && activeCat.id !== 'all' ? (
              <span className="flex items-center gap-2">
                <span className="text-[10px]">{activeCat.icon}</span> {activeCat.label}
              </span>
            ) : 'All Posts'}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

          {/* ══ MAIN FEED ══ */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Toolbar */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm">
              {/* Sort pills */}
              <div className="flex items-center bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border-default)] w-full xl:w-auto overflow-x-auto">
                {sortOpts.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-1 justify-center xl:flex-none ${
                      sortBy === opt.key
                        ? 'bg-[var(--surface-1)] text-[var(--brand-primary)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>

              {/* Search + New Post */}
              <div className="flex items-center gap-3 w-full xl:w-auto">
                <div className="relative flex-1 xl:w-72 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--brand-primary)] transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('discussion.searchPlaceholder') || "Search posts..."}
                    className="w-full pl-10 pr-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 transition-all"
                  />
                </div>

                <Link to="/discussion/new" className="shrink-0">
                  <button className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-semibold transition-all hover:brightness-110 shadow-sm">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Post</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Posts list */}
            <div className="space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] py-24 text-center flex flex-col items-center justify-center">
                  <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)] mb-4" />
                  <p className="text-[var(--text-secondary)] font-medium">Loading discussions...</p>
                </div>
              ) : discussions.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] py-24 px-4 text-center flex flex-col items-center justify-center shadow-sm">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-[var(--surface-2)] border border-[var(--border-default)] shadow-sm">
                    <MessageSquare className="w-8 h-8 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-xl font-bold text-[var(--text-primary)] mb-2">{t('discussion.noResults') || "No discussions found"}</p>
                  <p className="text-[var(--text-secondary)] mb-8 max-w-sm">Be the first to start a conversation about this topic and share your knowledge!</p>
                  <Link to="/discussion/new">
                    <button className="px-6 py-3 rounded-xl bg-[var(--brand-primary)] text-white font-semibold transition-all hover:brightness-110 flex items-center gap-2 shadow-sm">
                      <Plus className="w-4 h-4" /> Create Post
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {discussions.map((post) => <DiscussionPostCard key={post.id} post={post} />)}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                      page === currentPage
                        ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                        : 'bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* ══ SIDEBAR ══ */}
          <aside className="lg:w-72 shrink-0 space-y-6">

            {/* Category filter */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2 bg-[var(--surface-2)]">
                <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Topics</span>
              </div>
              <div className="p-2 space-y-1">
                {discussionCategories.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                        active
                          ? 'bg-[var(--surface-2)] text-[var(--brand-primary)] font-semibold'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] font-medium'
                      }`}
                    >
                      <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-lg bg-[var(--surface-1)] border border-[var(--border-default)] shrink-0 transition-transform ${active ? 'scale-105' : 'group-hover:scale-105'}`}>
                        {cat.icon}
                      </span>
                      <span className="flex-1 transition-colors">{cat.label}</span>
                      {active && <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rules */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5 shadow-sm">
              <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-5 flex items-center gap-2">
                <Flame className="w-4 h-4 text-[var(--text-secondary)]" />
                Posting Rules
              </p>
              <ul className="space-y-3">
                {[
                  'Be respectful & constructive',
                  'No spam or self-promotion',
                  'Keep topics coding-related',
                  'Mark posts as solved',
                  'Search before posting',
                ].map((rule, i) => (
                  <li key={rule} className="flex gap-3 items-start text-[var(--text-secondary)] text-sm">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[var(--surface-3)] border border-[var(--border-default)] text-[var(--text-muted)] text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-snug font-medium">{rule}</span>
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