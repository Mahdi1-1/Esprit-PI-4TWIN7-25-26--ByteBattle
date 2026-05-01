import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Building2, Shield, Search, CheckCircle, XCircle, Clock, Filter, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';

interface PendingCompany {
  id: string;
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  verified: boolean;
  status: string;
  createdAt: string;
  owner?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function AdminCompanies() {
  const navigate = useNavigate();
  const { colorScheme } = useTheme();
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      
      const res = await api.get(`/admin/companies/pending?${params}`);
      console.log('Admin companies response:', res.data);
      setCompanies(res.data.companies || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [filter, page]);

  const handleVerify = async (companyId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessing(companyId);
    try {
      await api.patch(`/admin/companies/${companyId}/verify`, { action });
      fetchCompanies();
    } catch (err) {
      console.error('Failed to verify company:', err);
    } finally {
      setProcessing(null);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--brand-primary)]/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[var(--brand-primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Companies</h1>
            <p className="text-sm text-[var(--text-secondary)]">Manage company verification</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchCompanies} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex gap-2">
          {(['pending', 'verified', 'rejected', 'all'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => { setFilter(f); setPage(1); }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Company</th>
                <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Industry</th>
                <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Owner</th>
                <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Status</th>
                <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Created</th>
                <th className="text-right p-4 text-sm font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">
                    No companies found
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id} className="border-b border-[var(--border-default)] hover:bg-[var(--surface-2)]/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--brand-primary)]/10 rounded-lg flex items-center justify-center">
                          {company.verified ? (
                            <Shield className="w-5 h-5 text-[var(--state-success)]" />
                          ) : (
                            <Building2 className="w-5 h-5 text-[var(--text-secondary)]" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">{company.name}</div>
                          <div className="text-xs text-[var(--text-muted)]">/{company.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {company.industry || '-'}
                    </td>
                    <td className="p-4">
                      {company.owner ? (
                        <div>
                          <div className="text-sm text-[var(--text-primary)]">{company.owner.firstName} {company.owner.lastName}</div>
                          <div className="text-xs text-[var(--text-muted)]">@{company.owner.username}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        company.verified 
                          ? 'bg-[var(--state-success)]/10 text-[var(--state-success)]'
                          : 'bg-[var(--state-warning)]/10 text-[var(--state-warning)]'
                      }`}>
                        {company.verified ? (
                          <><CheckCircle className="w-3 h-3" /> Verified</>
                        ) : (
                          <><Clock className="w-3 h-3" /> Pending</>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {!company.verified && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleVerify(company.id, 'APPROVE')}
                              disabled={processing === company.id}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleVerify(company.id, 'REJECT')}
                              disabled={processing === company.id}
                              className="text-[var(--state-error)] hover:bg-[var(--state-error)]/10"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--border-default)]">
            <div className="text-sm text-[var(--text-secondary)]">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}