import { ReactNode } from 'react';
import { Layout } from '../Layout';
import { CompanyNavbar } from '../CompanyNavbar';
import { useAuth } from '../../context/AuthContext';

interface CompanyLayoutProps {
  children: ReactNode;
}

export function CompanyLayout({ children }: CompanyLayoutProps) {
  const { user } = useAuth();

  return (
    <Layout>
      <CompanyNavbar
        userName={user?.username}
        userRole={(user?.companyRole as 'owner' | 'recruiter' | 'member') || 'member'}
      />
      {children}
    </Layout>
  );
}