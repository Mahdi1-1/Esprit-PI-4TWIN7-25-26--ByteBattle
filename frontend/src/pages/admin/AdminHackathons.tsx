import { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Breadcrumb, StatusChip, FilterBar } from '../../components/admin/AdminComponents';
import { Search, Plus, Trophy, Users, Calendar, Play, Pause, Square } from 'lucide-react';

interface Hackathon {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: 'UPCOMING' | 'ONGOING' | 'FROZEN' | 'FINISHED';
  teams: number;
  problems: number;
  participants: number;
}

const mockHackathons: Hackathon[] = [
  {
    id: 'hack-001',
    title: 'Winter CodeFest 2026',
    startDate: new Date('2026-02-15T10:00:00'),
    endDate: new Date('2026-02-15T15:00:00'),
    status: 'UPCOMING',
    teams: 0,
    problems: 10,
    participants: 0
  },
  {
    id: 'hack-002',
    title: 'Spring Showdown 2024',
    startDate: new Date('2024-01-20T09:00:00'),
    endDate: new Date('2024-01-20T18:00:00'),
    status: 'FINISHED',
    teams: 45,
    problems: 12,
    participants: 180
  },
  {
    id: 'hack-003',
    title: 'Summer Sprint 2025',
    startDate: new Date('2025-06-10T08:00:00'),
    endDate: new Date('2025-06-10T20:00:00'),
    status: 'ONGOING',
    teams: 32,
    problems: 15,
    participants: 128
  }
];

export function AdminHackathons() {
  const [hackathons] = useState<Hackathon[]>(mockHackathons);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'Hackathons' }]} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Hackathons & Events</h1>
              <p className="text-sm text-[var(--text-secondary)]">{hackathons.length} hackathons total</p>
            </div>
            <button className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Hackathon
            </button>
          </div>
        </div>

        <FilterBar>
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search hackathons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </FilterBar>

        <div className="grid grid-cols-1 gap-4">
          {hackathons.map((hackathon) => (
            <div
              key={hackathon.id}
              className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="w-5 h-5 text-[var(--brand-primary)]" />
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{hackathon.title}</h3>
                    <StatusChip status={hackathon.status} type="hackathon" />
                  </div>
                  <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {hackathon.startDate.toLocaleDateString()} - {hackathon.endDate.toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {hackathon.participants} participants
                    </span>
                    <span>{hackathon.problems} problems</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {hackathon.status === 'UPCOMING' && (
                    <button className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      Start
                    </button>
                  )}
                  {hackathon.status === 'ONGOING' && (
                    <>
                      <button className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors flex items-center gap-1">
                        <Pause className="w-3 h-3" />
                        Freeze
                      </button>
                      <button className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors flex items-center gap-1">
                        <Square className="w-3 h-3" />
                        End
                      </button>
                    </>
                  )}
                  <button className="px-3 py-1.5 border border-[var(--border-default)] rounded text-sm hover:bg-[var(--surface-2)] transition-colors">
                    Edit
                  </button>
                  <button className="px-3 py-1.5 border border-[var(--border-default)] rounded text-sm hover:bg-[var(--surface-2)] transition-colors">
                    Scoreboard
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
