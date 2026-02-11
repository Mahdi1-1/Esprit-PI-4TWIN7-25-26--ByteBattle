import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { communityDesigns, canvasChallenges } from '../data/canvasChallengeData';
import { mockUser } from '../data/mockData';
import { Eye, Heart, TrendingUp, Calendar, Award, Share2, Bookmark } from 'lucide-react';

export function CanvasGallery() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'top'>('popular');

  const filteredDesigns = communityDesigns.filter((design) => {
    if (selectedFilter === 'all') return true;
    return design.challengeId === selectedFilter;
  });

  const sortedDesigns = [...filteredDesigns].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.likes - a.likes;
      case 'top':
        return b.score - a.score;
      case 'recent':
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const getThemeEmoji = (theme: string) => {
    const emojis: Record<string, string> = {
      cyber_arena: '🔮',
      space_ops: '🚀',
      samurai_dojo: '⚔️',
      pixel_arcade: '🎮',
      mythic_rpg: '🏰',
      sports_arena: '⚽'
    };
    return emojis[theme] || '🎨';
  };

  return (
    <Layout>
      <Navbar 
        isLoggedIn 
        userAvatar={mockUser.avatar} 
        username={mockUser.username} 
      />
      <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full px-4 sm:px-6 lg:px-10 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🎨</span>
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                  Galerie Communautaire
                </h1>
                <p className="text-[var(--text-secondary)] mt-1">
                  Découvrez les meilleures architectures dessinées par la communauté
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Designs partagés', value: '1,234', icon: '🎨' },
              { label: 'Contributeurs', value: '567', icon: '👥' },
              { label: 'Likes totaux', value: '12.5K', icon: '❤️' },
              { label: 'Cette semaine', value: '+48', icon: '📈' }
            ].map((stat, idx) => (
              <div key={idx} className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-2xl font-bold gradient-brand-text">{stat.value}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Filters & Sort */}
          <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--border-default)] p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Challenge Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                  Challenge
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedFilter('all')}
                    className={`
                      px-3 py-1.5 text-sm rounded-lg border transition-all
                      ${selectedFilter === 'all'
                        ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)] border-[var(--brand-primary)]'
                        : 'bg-[var(--surface-2)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--brand-primary)]'
                      }
                    `}
                  >
                    Tous
                  </button>
                  {canvasChallenges.slice(0, 4).map((challenge) => (
                    <button
                      key={challenge.id}
                      onClick={() => setSelectedFilter(challenge.id)}
                      className={`
                        px-3 py-1.5 text-sm rounded-lg border transition-all truncate max-w-[200px]
                        ${selectedFilter === challenge.id
                          ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)] border-[var(--brand-primary)]'
                          : 'bg-[var(--surface-2)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--brand-primary)]'
                        }
                      `}
                      title={challenge.title}
                    >
                      {challenge.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                  Trier par
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'popular', label: '❤️ Plus populaires', icon: Heart },
                    { value: 'top', label: '🏆 Meilleurs scores', icon: Award },
                    { value: 'recent', label: '📅 Récents', icon: Calendar }
                  ].map((sort) => (
                    <button
                      key={sort.value}
                      onClick={() => setSortBy(sort.value as any)}
                      className={`
                        px-3 py-1.5 text-sm rounded-lg border transition-all flex items-center gap-1
                        ${sortBy === sort.value
                          ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)] border-[var(--brand-primary)]'
                          : 'bg-[var(--surface-2)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--brand-primary)]'
                        }
                      `}
                    >
                      {sort.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedDesigns.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                onView={() => navigate(`/canvas/gallery/${design.id}`)}
                getThemeEmoji={getThemeEmoji}
              />
            ))}
          </div>

          {/* Empty State */}
          {sortedDesigns.length === 0 && (
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-12 text-center">
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Aucun design trouvé
              </h3>
              <p className="text-[var(--text-secondary)] mb-4">
                Essayez de modifier vos filtres
              </p>
              <Button variant="secondary" onClick={() => setSelectedFilter('all')}>
                Voir tous les designs
              </Button>
            </div>
          )}

          {/* Load More */}
          {sortedDesigns.length > 0 && (
            <div className="text-center">
              <Button variant="secondary" size="lg">
                Charger plus de designs
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

interface DesignCardProps {
  design: any;
  onView: () => void;
  getThemeEmoji: (theme: string) => string;
}

function DesignCard({ design, onView, getThemeEmoji }: DesignCardProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--border-default)] overflow-hidden hover:border-[var(--brand-primary)] transition-all duration-200 group">
      {/* Thumbnail */}
      <div
        className="aspect-video bg-[var(--surface-2)] flex items-center justify-center cursor-pointer relative overflow-hidden"
        onClick={onView}
      >
        <span className="text-6xl">{getThemeEmoji(design.theme)}</span>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button variant="primary" size="sm">
            Voir en détail
          </Button>
        </div>

        {/* Theme Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="info" className="text-xs">
            {getThemeEmoji(design.theme)} {design.theme.split('_')[0]}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-bold text-[var(--text-primary)] line-clamp-2 cursor-pointer hover:text-[var(--brand-primary)]" onClick={onView}>
          {design.challengeTitle}
        </h3>

        {/* Author */}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold">
            {design.author[0]}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[var(--text-primary)]">{design.author}</div>
            <div className="text-xs text-[var(--text-muted)]">Level {design.authorLevel}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-[var(--brand-primary)]">{design.score}</div>
            <div className="text-xs text-[var(--text-muted)]">score</div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {design.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-[var(--surface-2)] text-[var(--text-secondary)] rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]">
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {design.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {design.likes.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLiked(!liked);
              }}
              className={`p-1.5 rounded hover:bg-[var(--surface-2)] transition-colors ${
                liked ? 'text-[var(--state-error)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setBookmarked(!bookmarked);
              }}
              className={`p-1.5 rounded hover:bg-[var(--surface-2)] transition-colors ${
                bookmarked ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-1.5 rounded hover:bg-[var(--surface-2)] transition-colors text-[var(--text-muted)]"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}