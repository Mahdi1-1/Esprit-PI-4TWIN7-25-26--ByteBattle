export class CompanyResponseDto {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  verified?: boolean;
  status: string;
  joinPolicy: "open" | "approval" | "invite_only";
  ownerId?: string;
  createdAt?: Date;
  updatedAt?: Date;

  static fromPrisma(company: any): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      logoUrl: company.logo || company.logoUrl,
      description: company.description,
      website: company.website,
      industry: company.industry,
      size: company.size,
      verified: company.verified,
      status: company.status,
      joinPolicy: company.joinPolicy,
      ownerId: company.ownerId,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}

export class CompanyMemberResponseDto {
  id: string;
  companyId: string;
  userId: string;
  role: "member" | "recruiter" | "owner";
  status: "pending" | "active" | "rejected";
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
      company: member.company
        ? CompanyResponseDto.fromPrisma(member.company)
        : undefined,
    };
  }
}

export class JoinCompanyResultDto {
  success: boolean;
  membership: CompanyMemberResponseDto;
  message: string;
}
