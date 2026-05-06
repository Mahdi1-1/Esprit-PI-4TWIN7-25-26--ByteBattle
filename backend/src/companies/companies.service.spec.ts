import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { CompaniesService } from "./companies.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationEmitterService } from "../notifications/notification-emitter.service";

describe("CompaniesService", () => {
  let service: CompaniesService;

  const mockPrisma = {
    company: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    companyMembership: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    companyNotification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    companyTeam: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    companyRoadmap: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    companyCourse: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    roadmapAssignment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    courseEnrollment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    companyJobPosting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    submission: {
      findMany: jest.fn(),
    },
    companyForumGroup: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    companyForumPost: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockNotificationEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationEmitterService, useValue: mockNotificationEmitter },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    jest.clearAllMocks();
    mockPrisma.companyMembership.findUnique.mockReset();
    mockPrisma.company.findUnique.mockReset();
  });

  describe("createCompany", () => {
    it("should create a company with slugified name and join code", async () => {
      const dto = {
        name: "Test Company",
        description: "A test company",
        industry: "Tech",
        size: "50-100",
      };

      const createdCompany = {
        id: "company-1",
        name: "Test Company",
        slug: "test-company",
        description: "A test company",
        industry: "Tech",
        size: "50-100",
        joinCode: "ABC12345",
        ownerId: "user-1",
        status: "active",
        joinPolicy: "approval",
        verified: false,
      };

      mockPrisma.company.create.mockResolvedValue(createdCompany);
      mockPrisma.companyMembership.create.mockResolvedValue({
        id: "membership-1",
        companyId: "company-1",
        userId: "user-1",
        role: "owner",
        status: "active",
      });
      mockPrisma.user.update.mockResolvedValue({ id: "user-1" });

      const result = await service.createCompany("user-1", dto);

      expect(mockPrisma.company.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Test Company",
          slug: "test-company",
          ownerId: "user-1",
        }),
      });
      expect(mockPrisma.companyMembership.create).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(result.name).toBe("Test Company");
      expect(result.slug).toBe("test-company");
    });

    it("should use custom slug when provided", async () => {
      const dto = { name: "Test Company", slug: "custom-slug" };

      const createdCompany = {
        id: "company-1",
        name: "Test Company",
        slug: "custom-slug",
        joinCode: "ABC12345",
        ownerId: "user-1",
        status: "active",
      };

      mockPrisma.company.create.mockResolvedValue(createdCompany);
      mockPrisma.companyMembership.create.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      await service.createCompany("user-1", dto);

      expect(mockPrisma.company.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ slug: "custom-slug" }),
      });
    });
  });

  describe("getPublicCompanies", () => {
    it("should return list of active companies", async () => {
      const companies = [
        { id: "company-1", name: "Company A", slug: "company-a", status: "active" },
        { id: "company-2", name: "Company B", slug: "company-b", status: "active" },
      ];

      mockPrisma.company.findMany.mockResolvedValue(companies);

      const result = await service.getPublicCompanies();

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith({
        where: { status: "active" },
        orderBy: { name: "asc" },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe("getUserCompanies", () => {
    it("should return companies for user's memberships", async () => {
      const memberships = [
        {
          id: "membership-1",
          companyId: "company-1",
          userId: "user-1",
          role: "owner",
          status: "active",
          joinedAt: new Date(),
          company: { id: "company-1", name: "Company A", slug: "company-a" },
        },
      ];

      mockPrisma.companyMembership.findMany.mockResolvedValue(memberships);

      const result = await service.getUserCompanies("user-1");

      expect(mockPrisma.companyMembership.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: { company: true },
        orderBy: { joinedAt: "desc" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("getCompanyById", () => {
    it("should return company when found", async () => {
      const company = {
        id: "company-1",
        name: "Test Company",
        slug: "test-company",
        status: "active",
      };

      mockPrisma.company.findUnique.mockResolvedValue(company);

      const result = await service.getCompanyById("company-1");

      expect(result.id).toBe("company-1");
    });

    it("should throw NotFoundException when company not found", async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);

      await expect(service.getCompanyById("non-existent")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("getMyCompany", () => {
    it("should return null when user has no active membership", async () => {
      mockPrisma.companyMembership.findFirst.mockResolvedValue(null);

      const result = await service.getMyCompany("user-1");

      expect(result).toBeNull();
    });

    it("should return company info when user is active member", async () => {
      const membership = {
        company: {
          id: "company-1",
          name: "Test Company",
          slug: "test-company",
          description: "Test",
          industry: "Tech",
          size: "50-100",
          verified: false,
          status: "active",
        },
      };

      mockPrisma.companyMembership.findFirst.mockResolvedValue(membership);

      const result = await service.getMyCompany("user-1");

      expect(result?.id).toBe("company-1");
    });
  });

  describe("updateCompany", () => {
    it("should update company when user is admin", async () => {
      const company = { id: "company-1", ownerId: "user-1", name: "Old Name" };
      const updatedCompany = { ...company, name: "New Name" };

      mockPrisma.company.findUnique.mockResolvedValue(company);
      mockPrisma.companyMembership.findUnique.mockResolvedValue({
        companyId: "company-1",
        userId: "user-1",
        role: "owner",
        status: "active",
      });
      mockPrisma.company.update.mockResolvedValue(updatedCompany);

      const result = await service.updateCompany("company-1", "user-1", {
        name: "New Name",
      });

      expect(mockPrisma.company.update).toHaveBeenCalled();
      expect(result.name).toBe("New Name");
    });

    it("should throw ForbiddenException when user is not admin", async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ id: "company-1", ownerId: "owner-1" });
      mockPrisma.companyMembership.findUnique.mockResolvedValue({
        companyId: "company-1",
        userId: "user-1",
        role: "member",
        status: "active",
      });

      await expect(
        service.updateCompany("company-1", "user-1", { name: "Test" }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("regenerateJoinCode", () => {
    it("should generate new timed join code for admin", async () => {
      const company = { id: "company-1", ownerId: "user-1" };

      mockPrisma.company.findUnique.mockResolvedValue(company);
      mockPrisma.companyMembership.findUnique.mockResolvedValue({
        companyId: "company-1",
        userId: "user-1",
        role: "owner",
        status: "active",
      });
      mockPrisma.company.update.mockResolvedValue({ joinCode: "NEWCODE-XYZ" });

      const result = await service.regenerateJoinCode("company-1", "user-1");

      expect(result).toHaveProperty("joinCode");
      expect(result).toHaveProperty("expiresAt");
      expect(mockPrisma.company.update).toHaveBeenCalled();
    });

    it("should throw ForbiddenException when user is not admin", async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ id: "company-1", ownerId: "owner-1" });
      mockPrisma.companyMembership.findUnique.mockResolvedValue({
        companyId: "company-1",
        userId: "user-1",
        role: "member",
        status: "active",
      });

      await expect(
        service.regenerateJoinCode("company-1", "user-1"),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("getCompanyMembers", () => {
    it("should return members when user is active member", async () => {
      const members = [
        {
          id: "membership-1",
          companyId: "company-1",
          userId: "user-1",
          role: "owner",
          status: "active",
          joinedAt: new Date(),
          user: { id: "user-1", username: "owner", email: "owner@test.com" },
        },
      ];

      mockPrisma.companyMembership.findUnique.mockResolvedValue({
        companyId: "company-1",
        userId: "user-1",
        status: "active",
      });
      mockPrisma.companyMembership.findMany.mockResolvedValue(members);

      const result = await service.getCompanyMembers("company-1", "user-1");

      expect(result).toHaveLength(1);
    });

    it("should throw ForbiddenException when user is not active member", async () => {
      mockPrisma.companyMembership.findUnique.mockResolvedValue(null);

      await expect(
        service.getCompanyMembers("company-1", "user-1"),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("joinCompany", () => {
    it("should allow joining open company directly", async () => {
      const company = {
        id: "company-1",
        joinPolicy: "open",
        ownerId: "owner-1",
        status: "active",
      };
      const membership = {
        id: "membership-1",
        companyId: "company-1",
        userId: "user-1",
        role: "member",
        status: "active",
        joinedAt: new Date(),
        requestedAt: new Date(),
        company: { name: "Test Company" },
      };

      mockPrisma.company.findUnique.mockResolvedValue(company);
      mockPrisma.companyMembership.findUnique.mockResolvedValue(null);
      mockPrisma.companyMembership.create.mockResolvedValue(membership);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.joinCompany("user-1", "company-1");

      expect(result.status).toBe("active");
      expect(mockNotificationEmitter.emit).not.toHaveBeenCalled();
    });

    it("should create pending request for approval-required company", async () => {
      const company = {
        id: "company-1",
        joinPolicy: "approval",
        ownerId: "owner-1",
        status: "active",
      };
      const membership = {
        id: "membership-1",
        companyId: "company-1",
        userId: "user-1",
        role: "member",
        status: "pending",
        joinedAt: new Date(),
        requestedAt: new Date(),
        company: { name: "Test Company" },
      };

      mockPrisma.company.findUnique.mockResolvedValue(company);
      mockPrisma.companyMembership.findUnique.mockResolvedValue(null);
      mockPrisma.companyMembership.create.mockResolvedValue(membership);
      mockPrisma.companyNotification.create.mockResolvedValue({});
      mockNotificationEmitter.emit.mockResolvedValue({});

      const result = await service.joinCompany("user-1", "company-1");

      expect(result.status).toBe("pending");
      expect(mockNotificationEmitter.emit).toHaveBeenCalled();
    });

    it("should throw ForbiddenException for invite-only company", async () => {
      const company = { id: "company-1", joinPolicy: "invite_only", status: "active" };

      mockPrisma.company.findUnique.mockResolvedValue(company);

      await expect(service.joinCompany("user-1", "company-1")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("should throw BadRequestException when already a member", async () => {
      const company = { id: "company-1", status: "active" };
      const existingMembership = {
        companyId: "company-1",
        userId: "user-1",
        status: "active",
      };

      mockPrisma.company.findUnique.mockResolvedValue(company);
      mockPrisma.companyMembership.findUnique.mockResolvedValue(existingMembership);

      await expect(service.joinCompany("user-1", "company-1")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe("joinByCode", () => {
    it("should throw NotFoundException for invalid code", async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);

      await expect(service.joinByCode("user-1", "INVALID")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("should throw BadRequestException for inactive company", async () => {
      const company = { id: "company-1", joinCode: "VALIDCODE", status: "inactive" };

      mockPrisma.company.findUnique.mockResolvedValue(company);

      await expect(service.joinByCode("user-1", "VALIDCODE")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe("removeMember", () => {
    it("should remove member and notify", async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ id: "company-1", ownerId: "owner-2", name: "Test" });
      mockPrisma.companyMembership.findUnique
        .mockResolvedValueOnce({
          companyId: "company-1",
          userId: "owner-1",
          role: "owner",
          status: "active",
        })
        .mockResolvedValueOnce({
          id: "membership-1",
          companyId: "company-1",
          userId: "member-1",
        });
      mockPrisma.companyMembership.delete.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});
      mockNotificationEmitter.emit.mockResolvedValue({});

      const result = await service.removeMember("company-1", "member-1", "owner-1");

      expect(result.success).toBe(true);
      expect(mockPrisma.companyMembership.delete).toHaveBeenCalled();
      expect(mockNotificationEmitter.emit).toHaveBeenCalled();
    });

    it("should throw BadRequestException when removing owner", async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ id: "company-1", ownerId: "owner-1" });

      await expect(
        service.removeMember("company-1", "owner-1", "owner-1"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("should throw NotFoundException when member not found", async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ id: "company-1", ownerId: "owner-2" });
      mockPrisma.companyMembership.findUnique
        .mockResolvedValueOnce({
          companyId: "company-1",
          userId: "owner-1",
          role: "owner",
          status: "active",
        })
        .mockResolvedValueOnce(null);

      await expect(
        service.removeMember("company-1", "non-existent", "owner-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("inviteMember", () => {
    it("should invite existing user to company", async () => {
      const user = { id: "user-1", email: "test@example.com" };
      const membership = {
        id: "membership-1",
        companyId: "company-1",
        userId: "user-1",
        role: "member",
        status: "pending",
      };

      mockPrisma.company.findUnique.mockResolvedValue({ id: "company-1", ownerId: "owner-2", name: "Test" });
      mockPrisma.companyMembership.findUnique
        .mockResolvedValueOnce({
          companyId: "company-1",
          userId: "owner-1",
          role: "owner",
          status: "active",
        })
        .mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.companyMembership.create.mockResolvedValue(membership);
      mockPrisma.companyNotification.create.mockResolvedValue({});
      mockNotificationEmitter.emit.mockResolvedValue({});

      const result = await service.inviteMember(
        "company-1",
        "test@example.com",
        "owner-1",
      );

      expect(result.userId).toBe("user-1");
      expect(mockNotificationEmitter.emit).toHaveBeenCalled();
    });

    it("should throw NotFoundException when user not found", async () => {
      mockPrisma.companyMembership.findUnique.mockResolvedValueOnce({
        companyId: "company-1",
        userId: "owner-1",
        role: "owner",
        status: "active",
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.inviteMember("company-1", "nonexistent@example.com", "owner-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("respondToJoinRequest", () => {
    it("should approve join request and update user", async () => {
      const membership = {
        id: "membership-1",
        companyId: "company-1",
        userId: "user-1",
        status: "pending",
        role: "member",
      };
      const updatedMembership = { ...membership, status: "active" };

      mockPrisma.company.findUnique.mockResolvedValue({ id: "company-1", ownerId: "owner-2", name: "Test" });
      mockPrisma.companyMembership.findUnique
        .mockResolvedValueOnce({
          companyId: "company-1",
          userId: "owner-1",
          role: "owner",
          status: "active",
        })
        .mockResolvedValueOnce(membership);
      mockPrisma.companyMembership.update.mockResolvedValue(updatedMembership);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.companyNotification.create.mockResolvedValue({});
      mockNotificationEmitter.emit.mockResolvedValue({});

      const result = await service.respondToJoinRequest(
        "company-1",
        "user-1",
        "approve",
        "owner-1",
      );

      expect(result.status).toBe("active");
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException for non-pending request", async () => {
      mockPrisma.companyMembership.findUnique
        .mockResolvedValueOnce({
          companyId: "company-1",
          userId: "owner-1",
          role: "owner",
          status: "active",
        })
        .mockResolvedValueOnce(null);

      await expect(
        service.respondToJoinRequest("company-1", "user-1", "approve", "owner-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("updateMemberRole", () => {
    it("should update member role and send notification", async () => {
      const membership = {
        id: "membership-1",
        companyId: "company-1",
        userId: "user-1",
        status: "active",
        role: "member",
      };
      const updatedMembership = { ...membership, role: "recruiter" };

      mockPrisma.company.findUnique.mockResolvedValue({ id: "company-1", ownerId: "owner-1", name: "Test" });
      mockPrisma.companyMembership.findUnique
        .mockResolvedValueOnce({
          companyId: "company-1",
          userId: "owner-1",
          role: "owner",
          status: "active",
        })
        .mockResolvedValueOnce(membership);
      mockPrisma.companyMembership.update.mockResolvedValue(updatedMembership);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.companyNotification.create.mockResolvedValue({});
      mockNotificationEmitter.emit.mockResolvedValue({});

      const result = await service.updateMemberRole(
        "company-1",
        "user-1",
        "recruiter",
        "owner-1",
      );

      expect(result.role).toBe("recruiter");
      expect(mockNotificationEmitter.emit).toHaveBeenCalled();
    });

    it("should throw BadRequestException when changing owner role", async () => {
      mockPrisma.companyMembership.findUnique.mockResolvedValueOnce({
        companyId: "company-1",
        userId: "owner-1",
        role: "owner",
        status: "active",
      });
      mockPrisma.company.findUnique.mockResolvedValue({
        id: "company-1",
        ownerId: "owner-1",
      });

      await expect(
        service.updateMemberRole("company-1", "owner-1", "member", "owner-1"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("assignMemberToTeam", () => {
    it("should assign member to team", async () => {
      const membership = {
        id: "membership-1",
        companyId: "company-1",
        userId: "user-1",
        status: "active",
        user: { id: "user-1", username: "test", email: "test@test.com" },
        company: { id: "company-1", name: "Test" },
      };

      mockPrisma.company.findUnique.mockResolvedValue({ id: "company-1", ownerId: "owner-2" });
      mockPrisma.companyMembership.findUnique
        .mockResolvedValueOnce({
          companyId: "company-1",
          userId: "owner-1",
          role: "owner",
          status: "active",
        })
        .mockResolvedValueOnce(membership);
      mockPrisma.companyTeam.findUnique.mockResolvedValue({
        id: "team-1",
        companyId: "company-1",
      });
      mockPrisma.companyMembership.update.mockResolvedValue({
        ...membership,
        teamId: "team-1",
      });

      await service.assignMemberToTeam(
        "company-1",
        "user-1",
        "team-1",
        "owner-1",
      );

      expect(mockPrisma.companyMembership.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ teamId: "team-1" }),
        }),
      );
    });

    it("should throw NotFoundException for non-existent team", async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ id: "company-1", ownerId: "owner-2" });
      mockPrisma.companyMembership.findUnique
        .mockResolvedValueOnce({
          companyId: "company-1",
          userId: "owner-1",
          role: "owner",
          status: "active",
        })
        .mockResolvedValueOnce({
          companyId: "company-1",
          userId: "user-1",
          status: "active",
        });
      mockPrisma.companyTeam.findUnique.mockResolvedValue(null);

      await expect(
        service.assignMemberToTeam("company-1", "user-1", "team-1", "owner-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("requestVerification", () => {
    it("should reject verification request from non-owner", async () => {
      mockPrisma.companyMembership.findFirst.mockResolvedValue(null);

      await expect(service.requestVerification("user-1")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("should reject when company already verified", async () => {
      mockPrisma.companyMembership.findFirst.mockResolvedValue({
        company: { id: "company-1", verified: true, name: "Test" },
      });

      await expect(service.requestVerification("user-1")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("should submit verification request for unverified company", async () => {
      mockPrisma.companyMembership.findFirst.mockResolvedValue({
        company: { id: "company-1", verified: false, name: "Test" },
      });

      const result = await service.requestVerification("user-1");

      expect(result.message).toBe("Verification request submitted");
    });
  });

  describe("userIsCompanyMember", () => {
    it("should return true for active member", async () => {
      mockPrisma.companyMembership.findUnique.mockResolvedValue({
        companyId: "company-1",
        userId: "user-1",
        status: "active",
      });

      const result = await service.userIsCompanyMember("user-1", "company-1");

      expect(result).toBe(true);
    });

    it("should return false for non-active member", async () => {
      mockPrisma.companyMembership.findUnique.mockResolvedValue({
        companyId: "company-1",
        userId: "user-1",
        status: "pending",
      });

      const result = await service.userIsCompanyMember("user-1", "company-1");

      expect(result).toBe(false);
    });

    it("should return false when no membership", async () => {
      mockPrisma.companyMembership.findUnique.mockResolvedValue(null);

      const result = await service.userIsCompanyMember("user-1", "company-1");

      expect(result).toBe(false);
    });
  });

  describe("getCompanyMember", () => {
    it("should return member DTO when found", async () => {
      const membership = {
        id: "membership-1",
        companyId: "company-1",
        userId: "user-1",
        role: "member",
        status: "active",
        joinedAt: new Date(),
        company: { id: "company-1", name: "Test" },
      };

      mockPrisma.companyMembership.findUnique.mockResolvedValue(membership);

      const result = await service.getCompanyMember("company-1", "user-1");

      expect(result.userId).toBe("user-1");
    });

    it("should throw NotFoundException when not member", async () => {
      mockPrisma.companyMembership.findUnique.mockResolvedValue(null);

      await expect(
        service.getCompanyMember("company-1", "user-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});