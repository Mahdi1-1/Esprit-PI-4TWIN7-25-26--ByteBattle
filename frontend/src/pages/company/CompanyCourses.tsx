import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { VerificationBanner } from '../../components/company/VerificationBanner';
import { useAuth } from '../../context/AuthContext';
import { companyService, Company, CompanyCourse, CompanyRole, CourseSection } from '../../services/companyService';
import { AlertCircle, Plus, ArrowLeft, Lock, Unlock, BookOpen, Trash2, Users, Play, CheckCircle } from 'lucide-react';

export function CompanyCourses() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [courses, setCourses] = useState<CompanyCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CompanyCourse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', visibility: 'employees_only' as const });
  const [newSection, setNewSection] = useState({ title: '', type: 'text' as const, content: '' });
  const [sections, setSections] = useState<CourseSection[]>([]);

  const currentUserRole = user?.companyRole as CompanyRole || null;
  const canManage = currentUserRole === 'owner' || currentUserRole === 'recruiter';

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [companyData, coursesData] = await Promise.all([
        companyService.getCompany(companyId),
        companyService.getCompanyCourses(companyId),
      ]);
      setCompany(companyData);
      setCourses(coursesData);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSection = () => {
    if (!newSection.title.trim()) return;
    setSections([...sections, { ...newSection, id: Date.now().toString() }]);
    setNewSection({ title: '', type: 'text', content: '' });
  };

  const handleCreateCourse = async () => {
    if (!companyId || !newCourse.title.trim()) return;
    try {
      const created = await companyService.createCourse(companyId, {
        ...newCourse,
        content: sections,
        visibility: newCourse.visibility as 'public' | 'employees_only',
      });
      setCourses([...courses, created]);
      setIsCreating(false);
      setNewCourse({ title: '', description: '', visibility: 'employees_only' });
      setSections([]);
    } catch (err) {
      console.error('Failed to create course:', err);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!companyId || !confirm('Are you sure you want to delete this course?')) return;
    try {
      await companyService.deleteCourse(companyId, courseId);
      setCourses(courses.filter(c => c.id !== courseId));
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--surface-2)] rounded w-1/4"></div>
            <div className="h-64 bg-[var(--surface-2)] rounded-[var(--radius-lg)]"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !company) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="w-12 h-12 text-[var(--state-error)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Failed to load courses</h2>
            <p className="text-[var(--text-secondary)] mb-4">{error || 'Unknown error'}</p>
            <Button onClick={fetchData}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CompanyNavbar companyName={company.name} userName={user?.username || 'User'} userRole={currentUserRole || 'member'} />
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link to={`/companies/${companyId}/dashboard`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Courses</h1>
            <p className="text-[var(--text-secondary)]">{courses.length} courses</p>
          </div>
        </div>

        <VerificationBanner companyName={company.name} verified={company.verified} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">All Courses</h2>
              {canManage && (
                <Button variant="primary" size="sm" onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Create
                </Button>
              )}
            </div>

            {isCreating && (
              <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border-default)] space-y-4">
                <Input
                  placeholder="Course title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                />
                <select
                  value={newCourse.visibility}
                  onChange={(e) => setNewCourse({ ...newCourse, visibility: e.target.value as 'public' | 'employees_only' })}
                  className="w-full px-3 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                >
                  <option value="employees_only">Employees Only</option>
                  <option value="public">Public</option>
                </select>

                <div className="border-t border-[var(--border-default)] pt-4">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Add Sections</h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Section title"
                      value={newSection.title}
                      onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <select
                        value={newSection.type}
                        onChange={(e) => setNewSection({ ...newSection, type: e.target.value as 'text' | 'video' | 'challenge' })}
                        className="px-3 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                      >
                        <option value="text">Text</option>
                        <option value="video">Video</option>
                        <option value="challenge">Challenge</option>
                      </select>
                      <Button variant="secondary" size="sm" onClick={handleAddSection} disabled={!newSection.title.trim()}>
                        Add
                      </Button>
                    </div>
                  </div>
                  {sections.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {sections.map((s, i) => (
                        <div key={s.id} className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                          <span>{i + 1}.</span>
                          <span>{s.title}</span>
                          <Badge variant="default" className="text-xs">{s.type}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleCreateCourse} disabled={!newCourse.title.trim()}>
                    Create Course
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setIsCreating(false); setSections([]); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={`p-4 rounded-[var(--radius-md)] border cursor-pointer transition-colors ${
                    selectedCourse?.id === course.id
                      ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30'
                      : 'bg-[var(--surface-2)] border-[var(--border-default)] hover:border-[var(--brand-primary)]/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">{course.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{course.content?.length || 0} sections</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={course.visibility === 'public' ? 'default' : 'secondary'}>
                        {course.visibility === 'public' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      </Badge>
                      {canManage && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}>
                          <Trash2 className="w-4 h-4 text-[var(--state-error)]" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No courses yet. Create one to get started.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedCourse ? (
              <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedCourse.title}</h2>
                  {selectedCourse.description && (
                    <p className="text-[var(--text-secondary)] mt-2">{selectedCourse.description}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {selectedCourse.content?.map((section, index) => (
                    <div key={section.id || index} className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border-default)]">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">{section.type}</Badge>
                        <span className="font-medium text-[var(--text-primary)]">{section.title}</span>
                      </div>
                      {section.type === 'text' && (
                        <p className="text-sm text-[var(--text-secondary)]">{section.content}</p>
                      )}
                      {section.type === 'video' && (
                        <div className="aspect-video bg-[var(--surface-1)] rounded flex items-center justify-center">
                          <Play className="w-8 h-8 text-[var(--text-muted)]" />
                        </div>
                      )}
                      {section.type === 'challenge' && (
                        <Link to={`/problems/${section.content}`}>
                          <Button variant="secondary" size="sm">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Start Challenge
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>

                {canManage && (
                  <div className="flex gap-4">
                    <Button variant="primary">
                      <Users className="w-4 h-4 mr-2" />
                      Enroll Employees
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 text-center py-12">
                <BookOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">Select a course to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}