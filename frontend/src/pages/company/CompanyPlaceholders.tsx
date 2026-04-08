import { Link } from 'react-router';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Layout } from '../../components/Layout';

interface CompanyPlaceholderProps {
  title: string;
  description: string;
}

function CompanyPlaceholder({ title, description }: CompanyPlaceholderProps) {
  return (
    <Layout>
      <CompanyNavbar companyName="TechCorp Inc." userName="John Doe" userRole="owner" />
      <div className="w-full px-4 sm:px-6 lg:px-10 py-10">
        <div className="max-w-3xl mx-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">{title}</h1>
          <p className="text-[var(--text-secondary)] mb-6">{description}</p>
          <div className="flex gap-3">
            <Link
              to="/company/overview"
              className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-white hover:opacity-90"
            >
              Back to Overview
            </Link>
            <Link
              to="/company/candidates"
              className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
            >
              View Candidates
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function CompanyChallengesPlaceholder() {
  return (
    <CompanyPlaceholder
      title="Company Challenges"
      description="Challenges management screen is ready for integration with live company challenge data."
    />
  );
}

export function CompanyChallengeCreatePlaceholder() {
  return (
    <CompanyPlaceholder
      title="Create Company Challenge"
      description="Challenge creation flow placeholder. You can now navigate here from the company dashboard."
    />
  );
}

export function CompanyChallengeDetailsPlaceholder() {
  return (
    <CompanyPlaceholder
      title="Company Challenge Details"
      description="Challenge details and analytics placeholder page."
    />
  );
}

export function CompanyChallengeCandidatesPlaceholder() {
  return (
    <CompanyPlaceholder
      title="Challenge Candidates"
      description="Candidate list for this specific challenge will appear here."
    />
  );
}

export function CompanyCandidateDetailsPlaceholder() {
  return (
    <CompanyPlaceholder
      title="Candidate Profile"
      description="Detailed candidate submission and score report placeholder page."
    />
  );
}

export function CompanyMembersPlaceholder() {
  return (
    <CompanyPlaceholder
      title="Team Members"
      description="Company member and recruiter management placeholder page."
    />
  );
}

export function CompanyExportsPlaceholder() {
  return (
    <CompanyPlaceholder
      title="Exports & Reports"
      description="Export tools for assessments and candidate reports placeholder page."
    />
  );
}

export function CompanySettingsPlaceholder() {
  return (
    <CompanyPlaceholder
      title="Company Settings"
      description="Company profile, billing, and access control settings placeholder page."
    />
  );
}
