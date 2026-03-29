import api from '../api/axios';

export const adminService = {
  async getDashboardStats() {
    const { data } = await api.get('/admin/dashboard');
    return data;
  },

  async getSystemMetrics() {
    const { data } = await api.get('/admin/monitoring/services');
    return data;
  },

  async getJobQueue(params?: { page?: number; limit?: number; status?: string }) {
    const { data } = await api.get('/admin/monitoring/jobs', { params });
    return data;
  },

  async retryJob(jobId: string) {
    const { data } = await api.post(`/admin/monitoring/jobs/${jobId}/retry`);
    return data;
  },

  async getReports(params?: { page?: number; limit?: number; status?: string }) {
    const { data } = await api.get('/admin/reports', { params });
    return data;
  },

  async createReport(report: { type: string; targetType: string; targetId: string; reason: string }) {
    const { data } = await api.post('/admin/reports', report);
    return data;
  },

  async updateReportStatus(id: string, status: string) {
    const { data } = await api.patch(`/admin/reports/${id}`, { status });
    return data;
  },

  async getAuditLogs(params?: { page?: number; limit?: number; action?: string }) {
    const { data } = await api.get('/admin/audit-logs', { params });
    return data;
  },

  async getSubmissions(params?: { page?: number; limit?: number; verdict?: string; language?: string }) {
    const { data } = await api.get('/submissions', { params });
    return data;
  },
};
