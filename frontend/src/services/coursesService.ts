import api from '../api/axios';

export type CourseVisibility = 'public' | 'employees_only';

export interface CourseSection {
  id: string;
  title: string;
  type: 'text' | 'video' | 'challenge';
  content: string;
  links?: string[];
}

export interface CompanyCourse {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  content: CourseSection[];
  visibility: CourseVisibility;
  createdAt: string;
  enrollmentsCount?: number;
  company?: {
    id: string;
    name: string;
    logo?: string;
  };
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string;
    level: number;
    elo: number;
  };
  enrolledAt: string;
  completedAt?: string;
  progress: number;
}

export interface PublicCourse extends CompanyCourse {}

export const coursesService = {
  async getCompanyCourses(companyId: string): Promise<CompanyCourse[]> {
    const { data } = await api.get(`/companies/${companyId}/courses`);
    return data;
  },

  async getCourse(courseId: string): Promise<CompanyCourse> {
    const { data } = await api.get(`/courses/${courseId}`);
    return data;
  },

  async createCourse(companyId: string, dto: {
    title: string;
    description?: string;
    content: CourseSection[];
    visibility: CourseVisibility;
  }): Promise<CompanyCourse> {
    const { data } = await api.post(`/companies/${companyId}/courses`, dto);
    return data;
  },

  async updateCourse(courseId: string, dto: {
    title?: string;
    description?: string;
    content?: CourseSection[];
    visibility?: CourseVisibility;
  }): Promise<CompanyCourse> {
    const { data } = await api.patch(`/courses/${courseId}`, dto);
    return data;
  },

  async deleteCourse(courseId: string): Promise<void> {
    await api.delete(`/courses/${courseId}`);
  },

  async enrollInCourse(courseId: string): Promise<CourseEnrollment> {
    const { data } = await api.post(`/courses/${courseId}/enroll`);
    return data;
  },

  async updateEnrollmentProgress(courseId: string, progress: number): Promise<CourseEnrollment> {
    const { data } = await api.patch(`/courses/${courseId}/enrollments/me/progress`, { progress });
    return data;
  },

  async getCourseEnrollments(courseId: string): Promise<CourseEnrollment[]> {
    const { data } = await api.get(`/courses/${courseId}/enrollments`);
    return data;
  },

  async getPublicCourses(filters?: { companyId?: string; topic?: string }): Promise<PublicCourse[]> {
    const params = new URLSearchParams();
    if (filters?.companyId) params.append('companyId', filters.companyId);
    if (filters?.topic) params.append('topic', filters.topic);
    const { data } = await api.get(`/courses/public?${params.toString()}`);
    return data;
  },
};