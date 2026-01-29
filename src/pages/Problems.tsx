import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { SearchInput, Select } from '../components/Input';
import { ProblemCard } from '../components/ProblemCard';
import { mockProblems, mockUser } from '../data/mockData';
import { Filter } from 'lucide-react';

export function Problems() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [status, setStatus] = useState('all');

  const filteredProblems = mockProblems.filter((problem) => {
    const matchesSearch = problem.title.toLowerCase().includes(search.toLowerCase()) ||
      problem.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesDifficulty = difficulty === 'all' || problem.difficulty === difficulty;
    const matchesStatus = status === 'all' || problem.status === status;
    
    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar 
        isLoggedIn 
        userAvatar={mockUser.avatar} 
        username={mockUser.username} 
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Catalogue de Problèmes</h1>
          <p className="text-[var(--text-secondary)]">
            {mockProblems.length} problèmes disponibles pour améliorer vos compétences
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-[var(--text-muted)]" />
            <h3>Filtres</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchInput
              placeholder="Rechercher par titre ou tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <Select
              label="Difficulté"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              options={[
                { value: 'all', label: 'Toutes' },
                { value: 'easy', label: 'Facile' },
                { value: 'medium', label: 'Moyen' },
                { value: 'hard', label: 'Difficile' },
              ]}
            />
            
            <Select
              label="Statut"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'all', label: 'Tous' },
                { value: 'new', label: 'Nouveau' },
                { value: 'attempted', label: 'Tenté' },
                { value: 'solved', label: 'Résolu' },
              ]}
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Problèmes Résolus"
            value={mockProblems.filter(p => p.status === 'solved').length}
            total={mockProblems.length}
            color="var(--state-success)"
          />
          <StatCard
            label="En Cours"
            value={mockProblems.filter(p => p.status === 'attempted').length}
            total={mockProblems.length}
            color="var(--state-warning)"
          />
          <StatCard
            label="À Faire"
            value={mockProblems.filter(p => p.status === 'new').length}
            total={mockProblems.length}
            color="var(--text-muted)"
          />
          <StatCard
            label="Taux de Réussite"
            value={Math.round((mockProblems.filter(p => p.status === 'solved').length / mockProblems.length) * 100)}
            suffix="%"
            color="var(--brand-primary)"
          />
        </div>

        {/* Problems List */}
        {filteredProblems.length > 0 ? (
          <div className="space-y-3">
            {filteredProblems.map((problem) => (
              <ProblemCard key={problem.id} {...problem} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--text-muted)]">
              Aucun problème ne correspond à vos critères de recherche.
            </p>
          </div>
        )}

        {/* Pagination (placeholder) */}
        {filteredProblems.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button className="px-4 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors">
              Précédent
            </button>
            <div className="flex items-center gap-1">
              <button className="w-10 h-10 flex items-center justify-center bg-[var(--brand-primary)] text-[var(--bg-primary)] rounded-[var(--radius-md)] font-medium">
                1
              </button>
              <button className="w-10 h-10 flex items-center justify-center bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-[var(--radius-md)] hover:border-[var(--brand-primary)] transition-colors">
                2
              </button>
              <button className="w-10 h-10 flex items-center justify-center bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-[var(--radius-md)] hover:border-[var(--brand-primary)] transition-colors">
                3
              </button>
            </div>
            <button className="px-4 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors">
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  total, 
  suffix = '', 
  color 
}: { 
  label: string; 
  value: number; 
  total?: number; 
  suffix?: string; 
  color: string;
}) {
  return (
    <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
      <p className="text-caption text-[var(--text-muted)] mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-h2 font-semibold" style={{ color }}>
          {value}{suffix}
        </span>
        {total && (
          <span className="text-[var(--text-muted)]">/ {total}</span>
        )}
      </div>
    </div>
  );
}
