import api from '../api/axios';

export type CompanyRole = 'owner' | 'recruiter' | 'member';
export type CompanyMembershipStatus = 'pending' | 'active' | 'rejected';
export type CompanyRoadmapType = 'platform' | 'custom';
export type CompanyRoadmapVisibility = 'public' | 'employees_only';
export type CourseVisibility = 'public' | 'employees_only';
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type JobStatus = 'active' | 'closed';
export type CompanyNotificationType = 'join_request' | 'roadmap_assigned' | 'course_enrolled' | 'application_received' | 'badge_earned' | 'member_role_changed';

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  size?: string | null;
  joinCode?: string | null;
  verified: boolean;
  status: string;
  joinPolicy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyTeam {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  stats?: {
    memberCount: number;
    avgElo: number;
    totalSolved: number;
  };
  createdAt: string;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string | null;
    level: number;
    elo: number;
    solvedCount?: number;
  };
  role: CompanyRole;
  status: CompanyMembershipStatus;
  teamId?: string;
  team?: CompanyTeam;
  joinedAt: string;
}

export interface CompanyMembership {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyRole;
  status: CompanyMembershipStatus;
  joinedAt: string;
  company?: Company;
}

export interface JoinRequest {
  id: string;
  companyId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string | null;
    level: number;
    elo: number;
  };
  role: CompanyRole;
  status: CompanyMembershipStatus;
  requestedAt: string;
}

export interface CompanyRoadmap {
  id: string;
  companyId: string;
  title: string;
  description?: string | null;
  type: CompanyRoadmapType;
  challengeIds: string[];
  order: number;
  visibility: CompanyRoadmapVisibility;
  createdAt: string;
  assignmentsCount?: number;
}

export interface RoadmapAssignment {
  id: string;
  roadmapId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string | null;
  };
  assignedBy: string;
  assignedAt: string;
  completedAt?: string | null;
  progress: number;
}

export interface CompanyCourse {
  id: string;
  companyId: string;
  title: string;
  description?: string | null;
  content: CourseSection[];
  visibility: CourseVisibility;
  createdAt: string;
  enrollmentsCount?: number;
}

export interface CourseSection {
  id: string;
  title: string;
  type: 'text' | 'video' | 'challenge';
  content: string;
  links?: string[];
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string | null;
  };
  enrolledAt: string;
  completedAt?: string | null;
  progress: number;
}

export interface CompanyJob {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements: string[];
  salaryRange?: string | null;
  location?: string | null;
  type: JobType;
  status: JobStatus;
  applicants: string[];
  createdAt: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string | null;
    level: number;
    elo: number;
  };
  jobId: string;
  status: 'pending' | 'shortlisted' | 'rejected' | 'hired';
  appliedAt: string;
}

export interface CompanyNotification {
  id: string;
  companyId: string;
  type: CompanyNotificationType;
  userId?: string | null;
  user?: {
    id: string;
    username: string;
    profileImage?: string | null;
  } | null;
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  employeesCount: number;
  pendingRequestsCount: number;
  activeHackathonsCount: number;
  activeJobsCount: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  userId: string;
  username: string;
  profileImage?: string | null;
  description: string;
  createdAt: string;
}

export interface CompanyAnnouncement {
  id: string;
  type: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  hackathonId: string;
  companyId: string | null;
}

export const companyService = {
  async getPublicCompanies(): Promise<Company[]> {
    const { data } = await api.get('/companies');
    return data;
  },

  async getMyCompanies(): Promise<CompanyMembership[]> {
    const { data } = await api.get('/companies/my');
    return data;
  },

  async getMyCompanyId(): Promise<string | null> {
    const memberships = await this.getMyCompanies();
    const activeMembership = memberships.find((membership) => membership.status === 'active');
    return activeMembership?.companyId || memberships[0]?.companyId || null;
  },

  async getCompany(companyId: string): Promise<Company> {
    const { data } = await api.get(`/companies/${companyId}`);
    return data;
  },

  async createCompany(dto: { name: string; description?: string; website?: string; industry?: string; size?: string }): Promise<Company> {
    const { data } = await api.post('/companies', dto);
    return data;
  },

  async updateCompany(companyId: string, dto: { name?: string; description?: string; website?: string; industry?: string; size?: string }): Promise<Company> {
    const { data } = await api.patch(`/companies/${companyId}`, dto);
    return data;
  },

  async joinCompany(companyId: string): Promise<{ success: boolean; membership: CompanyMembership; message: string }> {
    const { data } = await api.post(`/companies/${companyId}/join`);
    return data;
  },

  async getMyAnnouncements(): Promise<CompanyAnnouncement[]> {
    const { data } = await api.get('/companies/my/announcements');
    return data;
  },

  async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    const { data } = await api.get(`/companies/${companyId}/members`);
    return data;
  },

  async getPendingJoinRequests(companyId: string): Promise<JoinRequest[]> {
    const { data } = await api.get(`/companies/${companyId}/join-requests`);
    return data;
  },

  async respondToJoinRequest(companyId: string, userId: string, action: 'approve' | 'reject'): Promise<void> {
    await api.post(`/companies/${companyId}/join-requests/${userId}/respond?action=${action}`);
  },

  async updateMemberRole(companyId: string, userId: string, role: CompanyRole): Promise<CompanyMember> {
    const { data } = await api.patch(`/companies/${companyId}/members/${userId}/role`, { role });
    return data;
  },

  async getCompanyTeams(companyId: string): Promise<CompanyTeam[]> {
    const { data } = await api.get(`/companies/${companyId}/teams`);
    return data;
  },

  async createCompanyTeam(companyId: string, dto: { name: string; description?: string }): Promise<CompanyTeam> {
    const { data } = await api.post(`/companies/${companyId}/teams`, dto);
    return data;
  },

  async assignMemberToTeam(companyId: string, userId: string, teamId: string | null): Promise<CompanyMember> {
    const { data } = await api.patch(`/companies/${companyId}/members/${userId}/team`, { teamId });
    return data;
  },

  async removeMember(companyId: string, userId: string): Promise<void> {
    await api.delete(`/companies/${companyId}/members/${userId}`);
  },

  async inviteMember(companyId: string, email: string): Promise<CompanyMembership> {
    const { data } = await api.post(`/companies/${companyId}/invite`, { email });
    return data;
  },

  async regenerateJoinCode(companyId: string): Promise<{ joinCode: string; expiresAt: string }> {
    const { data } = await api.post(`/companies/${companyId}/join-code/regenerate`);
    return data;
  },

  async getDashboardStats(companyId: string): Promise<DashboardStats> {
    const { data } = await api.get(`/companies/${companyId}/dashboard/stats`);
    return data;
  },

  async getActivityFeed(companyId: string, page = 1, limit = 20): Promise<{ items: ActivityItem[]; total: number }> {
    const { data } = await api.get(`/companies/${companyId}/dashboard/activity?page=${page}&limit=${limit}`);
    return data;
  },

  async getCompanyRoadmaps(companyId: string): Promise<CompanyRoadmap[]> {
    const { data } = await api.get(`/companies/${companyId}/roadmaps`);
    return data;
  },

  async createRoadmap(companyId: string, dto: { title: string; description?: string; type: CompanyRoadmapType; challengeIds?: string[]; visibility: CompanyRoadmapVisibility }): Promise<CompanyRoadmap> {
    const { data } = await api.post(`/companies/${companyId}/roadmaps`, dto);
    return data;
  },

  async assignRoadmap(companyId: string, roadmapId: string, userIds: string[]): Promise<void> {
    await api.post(`/companies/${companyId}/roadmaps/${roadmapId}/assign`, { userIds });
  },

  async updateRoadmap(companyId: string, roadmapId: string, dto: { title?: string; description?: string; challengeIds?: string[]; visibility?: CompanyRoadmapVisibility; order?: number }): Promise<CompanyRoadmap> {
    const { data } = await api.patch(`/companies/${companyId}/roadmaps/${roadmapId}`, dto);
    return data;
  },

  async deleteRoadmap(companyId: string, roadmapId: string): Promise<void> {
    await api.delete(`/companies/${companyId}/roadmaps/${roadmapId}`);
  },

  async getRoadmapAssignments(companyId: string, roadmapId: string): Promise<RoadmapAssignment[]> {
    const { data } = await api.get(`/companies/${companyId}/roadmaps/${roadmapId}/assignments`);
    return data;
  },

  async updateRoadmapProgress(companyId: string, roadmapId: string, progress: number): Promise<RoadmapAssignment> {
    const { data } = await api.patch(`/companies/${companyId}/roadmaps/${roadmapId}/progress`, { progress });
    return data;
  },

  async getCompanyCourses(companyId: string): Promise<CompanyCourse[]> {
    const { data } = await api.get(`/companies/${companyId}/courses`);
    return data;
  },

  async createCourse(companyId: string, dto: { title: string; description?: string; content: CourseSection[]; visibility: CourseVisibility }): Promise<CompanyCourse> {
    const { data } = await api.post(`/companies/${companyId}/courses`, dto);
    return data;
  },

  async enrollInCourse(companyId: string, courseId: string): Promise<CourseEnrollment> {
    const { data } = await api.post(`/companies/${companyId}/courses/${courseId}/enroll`);
    return data;
  },

  async updateCourseProgress(companyId: string, courseId: string, progress: number): Promise<CourseEnrollment> {
    const { data } = await api.patch(`/companies/${companyId}/courses/${courseId}/progress`, { progress });
    return data;
  },

  async getCourseEnrollments(companyId: string, courseId: string): Promise<CourseEnrollment[]> {
    const { data } = await api.get(`/companies/${companyId}/courses/${courseId}/enrollments`);
    return data;
  },

  async updateCourse(companyId: string, courseId: string, dto: { title?: string; description?: string; content?: CourseSection[]; visibility?: CourseVisibility }): Promise<CompanyCourse> {
    const { data } = await api.patch(`/companies/${companyId}/courses/${courseId}`, dto);
    return data;
  },

  async deleteCourse(companyId: string, courseId: string): Promise<void> {
    await api.delete(`/companies/${companyId}/courses/${courseId}`);
  },

  async getCompanyJobs(companyId: string): Promise<CompanyJob[]> {
    const { data } = await api.get(`/companies/${companyId}/jobs`);
    return data;
  },

  async createJob(companyId: string, dto: { title: string; description: string; requirements: string[]; salaryRange?: string; location?: string; type: JobType }): Promise<CompanyJob> {
    const { data } = await api.post(`/companies/${companyId}/jobs`, dto);
    return data;
  },

  async createCompanyJob(companyId: string, dto: { title: string; description: string; requirements?: string[]; salaryRange?: string; location?: string; type: JobType }): Promise<CompanyJob> {
    const { data } = await api.post(`/companies/${companyId}/jobs`, dto);
    return data;
  },

  async updateJob(companyId: string, jobId: string, dto: { title?: string; description?: string; requirements?: string[]; salaryRange?: string; location?: string; type?: JobType; status?: JobStatus }): Promise<CompanyJob> {
    const { data } = await api.patch(`/companies/${companyId}/jobs/${jobId}`, dto);
    return data;
  },

  async deleteJob(companyId: string, jobId: string): Promise<void> {
    await api.delete(`/companies/${companyId}/jobs/${jobId}`);
  },

  async applyToJob(companyId: string, jobId: string): Promise<void> {
    await api.post(`/companies/${companyId}/jobs/${jobId}/apply`);
  },

  async getJobApplications(companyId: string, jobId: string): Promise<JobApplication[]> {
    const { data } = await api.get(`/companies/${companyId}/jobs/${jobId}/applications`);
    return data;
  },

  async updateApplicationStatus(companyId: string, jobId: string, userId: string, status: 'shortlisted' | 'rejected' | 'hired'): Promise<JobApplication> {
    const { data } = await api.patch(`/companies/${companyId}/jobs/${jobId}/applications/${userId}/status`, { status });
    return data;
  },

  async getPublicJobs(): Promise<(CompanyJob & { company: { id: string; name: string } })[]> {
    const { data } = await api.get('/companies/public/jobs');
    return data;
  },

  async getCompanyNotifications(companyId: string, page = 1, limit = 20): Promise<{ notifications: CompanyNotification[]; total: number }> {
    const { data } = await api.get(`/companies/${companyId}/notifications?page=${page}&limit=${limit}`);
    return data;
  },

  async markNotificationRead(companyId: string, notificationId: string): Promise<void> {
    await api.post(`/companies/${companyId}/notifications/${notificationId}/read`);
  },

  async markAllNotificationsRead(companyId: string): Promise<void> {
    await api.post(`/companies/${companyId}/notifications/read-all`);
  },

  async getUnreadNotificationsCount(companyId: string): Promise<{ count: number }> {
    const { data } = await api.get(`/companies/${companyId}/notifications/unread-count`);
    return data;
  },

  async getCompanyChallenges(companyId: string): Promise<any[]> {
    const { data } = await api.get(`/challenges/company/${companyId}`);
    return data;
  },
};