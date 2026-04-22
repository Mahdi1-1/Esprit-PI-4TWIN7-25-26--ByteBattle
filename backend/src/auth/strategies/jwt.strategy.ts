import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject(PrismaService) private prisma: any,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        company: {
          select: {
            id: true,
            verified: true,
          },
        },
        ownedCompanies: {
          select: {
            id: true,
            verified: true,
          },
          take: 1,
        },
        companyMemberships: {
          where: { status: 'active' },
          select: {
            role: true,
            company: {
              select: {
                id: true,
                verified: true,
              },
            },
          },
          take: 1,
        },
      },
    });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException();
    }

    const ownerCompany = user.ownedCompanies?.[0] ?? null;
    const activeMembership = user.companyMemberships?.[0] ?? null;
    const resolvedCompany = user.company ?? ownerCompany ?? activeMembership?.company ?? null;
    const resolvedCompanyRole = user.companyRole ?? (ownerCompany ? 'owner' : activeMembership?.role ?? null);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: resolvedCompany?.id ?? user.companyId ?? null,
      companyRole: resolvedCompanyRole,
      company: resolvedCompany,
    };
  }
}
