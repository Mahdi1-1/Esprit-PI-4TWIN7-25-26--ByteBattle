import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Loader, MessageSquare, Send, Globe } from 'lucide-react';
import { hackathonsService } from '../../services/hackathonsService';
import api from '../../api/axios';

export function AdminHackathonClarifications() {
  const { id } = useParams<{ id: string }>();
  const [clarifications, setClarifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const fetchClarifications = async () => {
    if (!id) return;
    try {
      const data = await api.get(`/hackathons/${id}/clarifications?isAdmin=true`);
      setClarifications(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClarifications();
    const interval = setInterval(fetchClarifications, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAnswer = async (clarId: string, isBroadcast: boolean) => {
    const answer = answers[clarId]?.trim();
    if (!answer) return;
    try {
      await api.post(`/hackathons/${id}/clarifications/${clarId}/answer`, { answer, isBroadcast });
      setAnswers((a) => ({ ...a, [clarId]: '' }));
      await fetchClarifications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleNoResponse = async (clarId: string) => {
    try {
      await api.post(`/hackathons/${id}/clarifications/${clarId}/answer`, { answer: 'No response needed', isBroadcast: false });
      await fetchClarifications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const pending = clarifications.filter((c) => c.status === 'pending');
  const answered = clarifications.filter((c) => c.status === 'answered');

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-[var(--brand-primary)]" />
          <h1 className="text-2xl font-bold">Clarifications</h1>
          {pending.length > 0 && (
            <Badge variant="ongoing">{pending.length} pending</Badge>
          )}
        </div>

        {/* Pending */}
        <div>
          <h2 className="text-lg font-medium mb-3">Pending ({pending.length})</h2>
          <div className="space-y-4">
            {pending.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">No pending clarifications</p>
            )}
            {pending.map((clar) => (
              <div key={clar.id} className="p-4 bg-[var(--surface-1)] border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
                  <span>Team: {clar.teamId?.slice(-6)}</span>
                  {clar.challengeId && <span>• Problem: {clar.challengeId.slice(-6)}</span>}
                  <span>• {new Date(clar.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-[var(--text-primary)] mb-3">{clar.question}</p>
                <div className="flex gap-2 items-end">
                  <textarea
                    className="flex-1 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded text-sm h-16"
                    placeholder="Type your answer..."
                    value={answers[clar.id] || ''}
                    onChange={(e) => setAnswers((a) => ({ ...a, [clar.id]: e.target.value }))}
                  />
                  <div className="flex flex-col gap-1">
                    <Button variant="primary" size="sm" onClick={() => handleAnswer(clar.id, false)}>
                      <Send className="w-3 h-3" /> Private
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleAnswer(clar.id, true)}>
                      <Globe className="w-3 h-3" /> Broadcast
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleNoResponse(clar.id)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Answered */}
        <div>
          <h2 className="text-lg font-medium mb-3">Answered ({answered.length})</h2>
          <div className="space-y-2">
            {answered.map((clar) => (
              <div key={clar.id} className="p-3 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                  <Badge variant="ongoing">answered</Badge>
                  {clar.isBroadcast && <Badge variant="default">broadcast</Badge>}
                  <span>{new Date(clar.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Q: {clar.question}</p>
                <p className="text-sm text-[var(--text-primary)] mt-1">A: {clar.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
