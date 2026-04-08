export class CompanyResponseDto {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  domain?: string;
  status: string;
  joinPolicy: 'open' | 'approval' | 'invite_only';

  static fromPrisma(company: any): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      logoUrl: company.logoUrl,
      website: company.website,
      domain: company.domain,
      status: company.status,
      joinPolicy: company.joinPolicy,
    };
  }
}

export class CompanyMemberResponseDto {
  id: string;
  companyId: string;
  userId: string;
  role: 'member' | 'recruiter' | 'admin';
  status: 'pending' | 'active' | 'rejected';
  joinedAt: Date;
  company?: CompanyResponseDto;

  static fromPrisma(member: any): CompanyMemberResponseDto {
    return {
      id: member.id,
      companyId: member.companyId,
      userId: member.userId,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
      company: member.company ? CompanyResponseDto.fromPrisma(member.company) : undefined,
    };
  }
}

export class JoinCompanyResultDto {
  success: boolean;
  membership: CompanyMemberResponseDto;
  message: string;
}
