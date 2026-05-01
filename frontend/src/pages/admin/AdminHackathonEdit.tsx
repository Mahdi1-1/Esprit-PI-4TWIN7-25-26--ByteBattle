import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Breadcrumb } from '../../components/admin/AdminComponents';
import { hackathonsService } from '../../services/hackathonsService';
import api from '../../api/axios';
import { Skeleton } from '../../components/ui/skeleton';
import {
  ChevronRight, ChevronLeft, Check, Loader, Search,
  X, AlertCircle, Trophy, Save
} from 'lucide-react';

const STEPS = ['General', 'Rules', 'Problems', 'Team Policy', 'Timing', 'Access', 'Review'];

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'php', 'ruby', 'csharp', 'kotlin',
];

interface Challenge {
  id: string;
  title: string;
  difficulty: string;
  tags?: string[];
  testCases?: number;
}

export function AdminHackathonEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [originalStatus, setOriginalStatus] = useState('');

  // Step 1: General
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Step 2: Rules
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>(['javascript', 'python', 'cpp']);
  const [maxSubmissions, setMaxSubmissions] = useState<string>('');
  const [submissionCooldown, setSubmissionCooldown] = useState(60);
  const [penaltyMinutes, setPenaltyMinutes] = useState(20);
  const [customRules, setCustomRules] = useState('');

  // Step 3: Problems
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [challengeSearch, setChallengeSearch] = useState('');
  const [selectedProblems, setSelectedProblems] = useState<Challenge[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Step 4: Team Policy
  const [maxTeams, setMaxTeams] = useState(20);
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [allowSolo, setAllowSolo] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);

  // Step 5: Timing
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(180);
  const [freezeDuration, setFreezeDuration] = useState(30);
  const [checkinBefore, setCheckinBefore] = useState(30);

  // Step 6: Access
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [emailWhitelist, setEmailWhitelist] = useState('');
  const [minLevel, setMinLevel] = useState<string>('');

  // ── Load existing hackathon data ──────────────────────
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const h = await hackathonsService.getById(id);
        setOriginalStatus(h.status);

        // Prevent editing active/frozen hackathons
        if (!['draft', 'lobby'].includes(h.status)) {
          setError(`Cannot edit hackathon in "${h.status}" status. Only draft and lobby hackathons are editable.`);
          setLoading(false);
          return;
        }

        // Step 1: General
        setTitle(h.title || '');
        setDescription(h.description || '');
        setCoverImage(h.bannerUrl || '');

        // Step 2: Rules — parse from rulesMd if stored there
        if (h.rulesMd) {
          const settingsMatch = h.rulesMd.match(/Penalty (\d+)min \| Cooldown (\d+)s \| Languages: (.+)/);
          if (settingsMatch) {
            setPenaltyMinutes(parseInt(settingsMatch[1]) || 20);
            setSubmissionCooldown(parseInt(settingsMatch[2]) || 60);
            setAllowedLanguages(settingsMatch[3].split(', ').map((l: string) => l.trim()));
          }
          const maxSubMatch = h.rulesMd.match(/Max submissions per problem: (\d+)/);
          if (maxSubMatch) setMaxSubmissions(maxSubMatch[1]);

          // Extract custom rules (everything before the ---\n**Settings** block)
          const settingsIdx = h.rulesMd.indexOf('\n---\n**Settings**');
          if (settingsIdx > 0) {
            setCustomRules(h.rulesMd.substring(0, settingsIdx).trim());
          } else {
            setCustomRules(h.rulesMd);
          }
        }

        // Step 3: Problems — load challenges to match IDs
        if (h.challengeIds && h.challengeIds.length > 0) {
          try {
            const res = await api.get('/challenges');
            const allChallenges = Array.isArray(res.data) ? res.data : res.data.data || res.data.challenges || [];
            const mapped = allChallenges.map((c: any) => ({
              id: c.id || c._id,
              title: c.title,
              difficulty: c.difficulty || 'medium',
              tags: c.tags || [],
              testCases: c.testCases?.length || c.testCaseCount || 0,
            }));
            setAvailableChallenges(mapped);
            // Pre-select the hackathon's challenges in order
            const selected = h.challengeIds
              .map((cid: string) => mapped.find((c: Challenge) => c.id === cid))
              .filter(Boolean);
            setSelectedProblems(selected);
          } catch {
            console.error('Failed to load challenges');
          }
        }

        // Step 4: Team Policy
        if (h.teamPolicy) {
          setMinTeamSize(h.teamPolicy.minSize || 1);
          setMaxTeamSize(h.teamPolicy.maxSize || 4);
        }

        // Step 5: Timing
        if (h.startTime) {
          const start = new Date(h.startTime);
          setStartTime(start.toISOString().slice(0, 16));
          if (h.endTime) {
            const end = new Date(h.endTime);
            const dur = Math.round((end.getTime() - start.getTime()) / 60000);
            setDuration(dur);
          }
          if (h.freezeAt) {
            const freeze = new Date(h.freezeAt);
            const endMs = h.endTime ? new Date(h.endTime).getTime() : start.getTime() + duration * 60000;
            const freezeDur = Math.round((endMs - freeze.getTime()) / 60000);
            setFreezeDuration(freezeDur > 0 ? freezeDur : 0);
          } else {
            setFreezeDuration(0);
          }
        }

        // Step 6: Access
        if (h.scope === 'invite-only') {
          setVisibility('private');
          setInviteCode(h.joinCode || '');
        } else {
          setVisibility('public');
        }
      } catch (err: any) {
        setError('Failed to load hackathon data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Load challenges when entering step 3 (if not already loaded)
  useEffect(() => {
    if (step === 2 && availableChallenges.length === 0) {
      loadChallenges();
    }
  }, [step]);

  const loadChallenges = async () => {
    setLoadingChallenges(true);
    try {
      const res = await api.get('/challenges');
      const data = Array.isArray(res.data) ? res.data : res.data.data || res.data.challenges || [];
      setAvailableChallenges(data.map((c: any) => ({
        id: c.id || c._id,
        title: c.title,
        difficulty: c.difficulty || 'medium',
        tags: c.tags || [],
        testCases: c.testCases?.length || c.testCaseCount || 0,
      })));
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const toggleProblem = (challenge: Challenge) => {
    setSelectedProblems((prev) => {
      const exists = prev.find((p) => p.id === challenge.id);
      if (exists) return prev.filter((p) => p.id !== challenge.id);
      if (prev.length >= 15) return prev;
      return [...prev, challenge];
    });
  };

  const moveProblem = (index: number, direction: 'up' | 'down') => {
    setSelectedProblems((prev) => {
      const arr = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= arr.length) return arr;
      [arr[index], arr[targetIndex]] = [arr[targetIndex], arr[index]];
      return arr;
    });
  };

  const removeProblem = (cid: string) => {
    setSelectedProblems((prev) => prev.filter((p) => p.id !== cid));
  };

  const filteredChallenges = availableChallenges.filter((c) => {
    if (difficultyFilter !== 'all' && c.difficulty !== difficultyFilter) return false;
    if (challengeSearch && !c.title.toLowerCase().includes(challengeSearch.toLowerCase())) return false;
    return true;
  });

  const difficultyColor = (d: string) => {
    switch (d) {
      case 'easy': return 'text-green-400 bg-green-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'hard': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const canNext = () => {
    switch (step) {
      case 0: return title.trim().length > 0;
      case 1: return allowedLanguages.length > 0;
      case 2: return selectedProblems.length >= 1;
      case 3: return minTeamSize >= 1 && maxTeamSize >= minTeamSize;
      case 4: return startTime.length > 0 && duration >= 30;
      case 5: return true;
      case 6: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 60 * 1000);
      const freeze = freezeDuration > 0
        ? new Date(start.getTime() + (duration - freezeDuration) * 60 * 1000)
        : undefined;

      const rulesLines: string[] = [];
      if (customRules) rulesLines.push(customRules);
      rulesLines.push(`\n---\n**Settings**: Penalty ${penaltyMinutes}min | Cooldown ${submissionCooldown}s | Languages: ${allowedLanguages.join(', ')}`);
      if (maxSubmissions) rulesLines.push(`Max submissions per problem: ${maxSubmissions}`);

      const body = {
        title,
        description,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        freezeAt: freeze?.toISOString(),
        challengeIds: selectedProblems.map((p) => p.id),
        rulesMd: rulesLines.join('\n') || undefined,
        scope: visibility === 'private' ? 'invite-only' : 'public',
        bannerUrl: coverImage || undefined,
        teamPolicy: {
          minSize: minTeamSize,
          maxSize: maxTeamSize,
        },
      };

      await hackathonsService.update(id!, body);
      navigate(`/admin/hackathons/${id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update hackathon');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-96" />
          <div className="flex gap-2">{[1,2,3,4,5,6,7].map(i => <Skeleton key={i} className="h-8 w-8 rounded-full" />)}</div>
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  // ── Non-editable error ────────────────────────────────
  if (error && !['draft', 'lobby'].includes(originalStatus) && originalStatus) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'Hackathons', href: '/admin/hackathons' }, { label: 'Edit' }]} />
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-16 h-16 text-[var(--state-error)] mb-4 opacity-60" />
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Cannot Edit</h2>
            <p className="text-[var(--text-muted)] mb-6 max-w-md">{error}</p>
            <button
              onClick={() => navigate(`/admin/hackathons/${id}`)}
              className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Go to Hackathon Detail
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Breadcrumb items={[{ label: 'Admin' }, { label: 'Hackathons', href: '/admin/hackathons' }, { label: title || 'Edit', href: `/admin/hackathons/${id}` }, { label: 'Edit' }]} />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Edit Hackathon</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            originalStatus === 'draft' ? 'bg-gray-500/10 text-gray-400' : 'bg-blue-500/10 text-blue-400'
          }`}>
            {originalStatus}
          </span>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors cursor-pointer ${
                  i < step ? 'bg-green-500 text-white' :
                  i === step ? 'bg-[var(--brand-primary)] text-white' :
                  'bg-[var(--surface-3)] text-[var(--text-muted)]'
                }`}
                onClick={() => setStep(i)}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${i === step ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-[var(--border-default)]" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6 min-h-[400px]">

          {/* ─── Step 1: General ─── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Title <span className="text-red-400">*</span>
                </label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Spring Code Challenge 2026" maxLength={100}
                  className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">{title.length}/100</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your hackathon... (Markdown supported)" rows={6}
                  className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Tags</label>
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                  placeholder="algorithms, web-dev, ai (comma-separated)"
                  className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Banner Image URL</label>
                <input type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://example.com/image.jpg (optional)"
                  className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* ─── Step 2: Rules ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Allowed Languages <span className="text-red-400">*</span></label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setAllowedLanguages(allowedLanguages.length === LANGUAGES.length ? [] : [...LANGUAGES])}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--surface-3)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">
                    {allowedLanguages.length === LANGUAGES.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {LANGUAGES.map((lang) => (
                    <button key={lang}
                      onClick={() => setAllowedLanguages((prev) => prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang])}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        allowedLanguages.includes(lang) ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]'
                      }`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Max Submissions/Problem</label>
                  <input type="number" value={maxSubmissions} onChange={(e) => setMaxSubmissions(e.target.value)} placeholder="Unlimited" min={1}
                    className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Cooldown (seconds)</label>
                  <select value={submissionCooldown} onChange={(e) => setSubmissionCooldown(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors">
                    <option value={0}>None</option><option value={30}>30s</option><option value={60}>60s</option><option value={120}>2min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Penalty (minutes)</label>
                  <select value={penaltyMinutes} onChange={(e) => setPenaltyMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors">
                    <option value={0}>0</option><option value={10}>10</option><option value={20}>20 (ICPC standard)</option><option value={30}>30</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Custom Rules (optional)</label>
                <textarea value={customRules} onChange={(e) => setCustomRules(e.target.value)}
                  placeholder="Additional rules... (Markdown supported)" rows={4}
                  className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors resize-y" />
              </div>
            </div>
          )}

          {/* ─── Step 3: Problems ─── */}
          {step === 2 && (
            <div className="space-y-5">
              {selectedProblems.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Selected Problems ({selectedProblems.length})
                  </label>
                  <div className="space-y-1.5">
                    {selectedProblems.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3 px-3 py-2 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30 rounded-lg">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveProblem(i, 'up')} disabled={i === 0} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 text-xs">▲</button>
                          <button onClick={() => moveProblem(i, 'down')} disabled={i === selectedProblems.length - 1} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 text-xs">▼</button>
                        </div>
                        <span className="w-8 h-8 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center text-sm font-bold">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1 text-sm text-[var(--text-primary)] font-medium">{p.title}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColor(p.difficulty)}`}>{p.difficulty}</span>
                        <button onClick={() => removeProblem(p.id)} className="p-1 hover:bg-red-500/20 rounded transition-colors">
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg flex-1">
                  <Search className="w-4 h-4 text-[var(--text-muted)]" />
                  <input type="text" value={challengeSearch} onChange={(e) => setChallengeSearch(e.target.value)} placeholder="Search challenges..."
                    className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none" />
                </div>
                <div className="flex gap-1">
                  {['all', 'easy', 'medium', 'hard'].map((d) => (
                    <button key={d} onClick={() => setDifficultyFilter(d)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${difficultyFilter === d ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]'}`}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {loadingChallenges ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
                  <span className="ml-2 text-sm text-[var(--text-muted)]">Loading challenges...</span>
                </div>
              ) : filteredChallenges.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-2 opacity-30" />
                  <p className="text-sm text-[var(--text-muted)]">
                    {availableChallenges.length === 0 ? 'No challenges found.' : 'No challenges match your search.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                  {filteredChallenges.map((c) => {
                    const isSelected = selectedProblems.some((p) => p.id === c.id);
                    return (
                      <button key={c.id} onClick={() => toggleProblem(c)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          isSelected ? 'bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30' : 'bg-[var(--surface-2)] border border-transparent hover:border-[var(--border-hover)]'
                        }`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)]' : 'border-[var(--border-default)]'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="flex-1 text-sm text-[var(--text-primary)] font-medium">{c.title}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColor(c.difficulty)}`}>{c.difficulty}</span>
                        {c.tags && c.tags.length > 0 && (
                          <div className="flex gap-1">
                            {c.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-muted)]">{tag}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── Step 4: Team Policy ─── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Min Team Size</label>
                  <select value={minTeamSize} onChange={(e) => setMinTeamSize(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors">
                    {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Max Team Size</label>
                  <select value={maxTeamSize} onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors">
                    {[1,2,3,4,5,6,7,8,9,10].filter((n) => n >= minTeamSize).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              {originalStatus === 'lobby' && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Hackathon is in lobby — teams may have already registered. Changing team policy may affect existing teams.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 5: Timing ─── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Start Date & Time <span className="text-red-400">*</span></label>
                <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Duration</label>
                  <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors">
                    <option value={60}>1 hour</option><option value={90}>1h 30min</option><option value={120}>2 hours</option>
                    <option value={180}>3 hours</option><option value={240}>4 hours</option><option value={300}>5 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Freeze Time</label>
                  <select value={freezeDuration} onChange={(e) => setFreezeDuration(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors">
                    <option value={0}>No freeze</option><option value={15}>Last 15 min</option><option value={30}>Last 30 min</option>
                    <option value={45}>Last 45 min</option><option value={60}>Last 60 min</option>
                  </select>
                </div>
              </div>
              {startTime && (
                <div className="p-4 bg-[var(--surface-2)] rounded-lg border border-[var(--border-default)]">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">📅 Timeline Preview</h4>
                  <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                    <p>🚀 Start: <strong>{new Date(startTime).toLocaleString()}</strong></p>
                    {freezeDuration > 0 && (
                      <p>🧊 Freeze: <strong>{new Date(new Date(startTime).getTime() + (duration - freezeDuration) * 60000).toLocaleString()}</strong></p>
                    )}
                    <p>🏁 End: <strong>{new Date(new Date(startTime).getTime() + duration * 60000).toLocaleString()}</strong></p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 6: Access ─── */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Visibility</label>
                <div className="flex gap-3">
                  {(['public', 'private'] as const).map((v) => (
                    <button key={v} onClick={() => setVisibility(v)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        visibility === v
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--text-primary)]'
                          : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                      }`}>
                      {v === 'public' ? '🌍 Public' : '🔒 Private'}
                      <p className="text-xs font-normal mt-1 text-[var(--text-muted)]">
                        {v === 'public' ? 'Anyone can see and join' : 'Invite code required'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 7: Review ─── */}
          {step === 6 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">📋 Review Changes</h2>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <ReviewSection title="General">
                  <ReviewItem label="Title" value={title} />
                  <ReviewItem label="Scope" value={visibility === 'private' ? 'invite-only' : 'public'} />
                </ReviewSection>
                <ReviewSection title="Rules">
                  <ReviewItem label="Languages" value={allowedLanguages.join(', ')} />
                  <ReviewItem label="Cooldown" value={`${submissionCooldown}s`} />
                  <ReviewItem label="Penalty" value={`${penaltyMinutes} min`} />
                </ReviewSection>
                <ReviewSection title="Problems">
                  {selectedProblems.map((p, i) => (
                    <ReviewItem key={p.id} label={String.fromCharCode(65 + i)} value={`${p.title} (${p.difficulty})`} />
                  ))}
                </ReviewSection>
                <ReviewSection title="Teams">
                  <ReviewItem label="Team Size" value={`${minTeamSize}-${maxTeamSize}`} />
                </ReviewSection>
                <ReviewSection title="Timing">
                  <ReviewItem label="Start" value={startTime ? new Date(startTime).toLocaleString() : '—'} />
                  <ReviewItem label="End" value={startTime ? new Date(new Date(startTime).getTime() + duration * 60000).toLocaleString() : '—'} />
                  <ReviewItem label="Freeze" value={freezeDuration > 0 ? `Last ${freezeDuration} min` : 'None'} />
                </ReviewSection>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => step === 0 ? navigate(`/admin/hackathons/${id}`) : setStep((s) => s - 1)}
            className="flex items-center gap-1 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Cancel' : 'Previous'}
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}
              className="flex items-center gap-1 px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 disabled:opacity-50 transition-colors">
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

/* ───── Review Helpers ───── */
function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 bg-[var(--surface-2)] rounded-lg border border-[var(--border-default)]">
      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-xs">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--text-primary)] font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
