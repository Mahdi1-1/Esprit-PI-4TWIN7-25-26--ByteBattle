import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { VerificationBanner } from '../../components/company/VerificationBanner';
import { useAuth } from '../../context/AuthContext';
import { companyService, Company, CompanyNotification, CompanyRole } from '../../services/companyService';
import { notificationsService, CompanyNotificationType } from '../../services/notificationsService';
import { AlertCircle, ArrowLeft, Bell, Search, Check, CheckCheck, Clock, UserPlus, BookOpen, GraduationCap, Briefcase, Award, Trash2, Filter } from 'lucide-react';

const notificationTypeLabels: Record<CompanyNotificationType, string> = {
  join_request: 'Join Request',
  roadmap_assigned: 'Roadmap Assigned',
  course_enrolled: 'Course Enrolled',
  application_received: 'Application Received',
  badge_earned: 'Badge Earned',
};

const notificationTypeIcons: Record<CompanyNotificationType, any> = {
  join_request: UserPlus,
  roadmap_assigned: BookOpen,
  course_enrolled: GraduationCap,
  application_received: Briefcase,
  badge_earned: Award,
};

export function CompanyNotifications() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [notifications, setNotifications] = useState<CompanyNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<CompanyNotificationType | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isMarkingRead, setIsMarkingRead] = useState<string | null>(null);

  const currentUserRole = user?.companyRole as CompanyRole || null;

  const fetchNotifications = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const filters: any = {};
      if (typeFilter !== 'all') filters.type = typeFilter;
      if (readFilter === 'unread') filters.read = false;
      if (readFilter === 'read') filters.read = true;

      const { notifications: data, total: totalCount } = await notificationsService.getCompanyNotifications(
        companyId,
        page,
        20,
        filters
      );
      setNotifications(data);
      setTotal(totalCount);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [companyId, page, typeFilter, readFilter]);

  const fetchCompany = useCallback(async () => {
    if (!companyId) return;
    try {
      const companyData = await companyService.getCompany(companyId);
      setCompany(companyData);
    } catch (err) {
      console.error('Failed to load company:', err);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!companyId) return;
    setIsMarkingRead(notificationId);
    try {
      await notificationsService.markCompanyNotificationRead(companyId, notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setIsMarkingRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!companyId) return;
    try {
      await notificationsService.markAllCompanyNotificationsRead(companyId);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationLink = (notification: CompanyNotification) => {
    switch (notification.type) {
      case 'join_request':
        return `/companies/${companyId}/join-requests`;
      case 'roadmap_assigned':
        return `/companies/${companyId}/roadmaps`;
      case 'course_enrolled':
        return `/companies/${companyId}/courses`;
      case 'application_received':
        return `/companies/${companyId}/jobs`;
      case 'badge_earned':
        return `/profile/${notification.user?.username}`;
      default:
        return '#';
    }
  };

  if (loading && notifications.length === 0) {
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

  return (
    <Layout>
      {company && (
        <CompanyNavbar companyName={company.name} userName={user?.username || 'User'} userRole={currentUserRole || 'member'} />
      )}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link to={`/companies/${companyId}/dashboard`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
            <p className="text-[var(--text-secondary)]">{total} notifications</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input placeholder="Search notifications..." className="pl-10" />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CompanyNotificationType | 'all')}
            className="px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
          >
            <option value="all">All Types</option>
            <option value="join_request">Join Requests</option>
            <option value="roadmap_assigned">Roadmap Assigned</option>
            <option value="course_enrolled">Course Enrolled</option>
            <option value="application_received">Applications</option>
            <option value="badge_earned">Badges</option>
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as 'all' | 'unread' | 'read')}
            className="px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          <Button variant="secondary" onClick={handleMarkAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-[var(--state-error)]/10 border border-[var(--state-error)]/30 rounded-[var(--radius-md)]">
            <p className="text-[var(--state-error)]">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = notificationTypeIcons[notification.type as keyof typeof notificationTypeIcons] || Bell;
            return (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 rounded-[var(--radius-md)] border transition-colors ${
                  notification.read 
                    ? 'bg-[var(--surface-2)] border-[var(--border-default)]' 
                    : 'bg-[var(--brand-primary)]/5 border-[var(--brand-primary)]/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  notification.read ? 'bg-[var(--surface-1)]' : 'bg-[var(--brand-primary)]/20'
                }`}>
                  <Icon className={`w-5 h-5 ${notification.read ? 'text-[var(--text-muted)]' : 'text-[var(--brand-primary)]'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default" className="text-xs">
                      {notificationTypeLabels[notification.type as keyof typeof notificationTypeLabels] || 'Notification'}
                    </Badge>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />
                    )}
                  </div>
                  <p className="text-[var(--text-primary)]">
                    {(notification as any).message || 'Notification'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-muted)]">
                    <Clock className="w-3 h-3" />
                    {formatTime(notification.createdAt)}
                    {notification.user && (
                      <span>by {notification.user.username}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={isMarkingRead === notification.id}
                    >
                      {isMarkingRead === notification.id ? (
                        <span className="w-4 h-4 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Link to={getNotificationLink(notification)}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}

          {notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">No notifications found</p>
            </div>
          )}
        </div>

        {total > page * 20 && (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={() => setPage(page + 1)}>
              Load More
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}