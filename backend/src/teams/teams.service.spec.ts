import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TeamsService } from "./teams.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationEmitterService } from "../notifications/notification-emitter.service";

describe("TeamsService", () => {
  let service: TeamsService;

  const mockPrisma = {
    userTeam: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    hackathon: {
      findUnique: jest.fn(),
    },
    hackathonTeam: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $runCommandRaw: jest.fn(),
  };

  const mockNotificationEmitter = {
    emit: jest.fn(),
  };

  const mockUser = {
    id: "user-1",
    username: "testuser",
    profileImage: null,
  };

  const mockTeam = {
    id: "team-1",
    name: "Test Team",
    ownerId: "user-1",
    joinCode: "ABC123",
    members: [
      {
        userId: "user-1",
        username: "testuser",
        role: "captain",
        joinedAt: new Date(),
      },
    ],
    joinRequests: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: NotificationEmitterService,
          useValue: mockNotificationEmitter,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  describe("createTeam", () => {
    it("should create a team successfully", async () => {
      const dto = { name: "New Team" };
      mockPrisma.userTeam.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userTeam.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.userTeam.create.mockResolvedValue({
        ...mockTeam,
        id: "team-new",
        name: "New Team",
      });
      mockNotificationEmitter.emit.mockResolvedValue(undefined);

      const result = await service.createTeam("user-1", dto);

      expect(result).toBeDefined();
      expect(result.name).toBe("New Team");
      expect(mockPrisma.userTeam.create).toHaveBeenCalled();
    });

    it("should throw BadRequestException when name is empty", async () => {
      const dto = { name: "   " };

      await expect(service.createTeam("user-1", dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when team name already exists", async () => {
      const dto = { name: "Test Team" };
      mockPrisma.userTeam.findFirst.mockResolvedValue(mockTeam);

      await expect(service.createTeam("user-1", dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("getMyTeams", () => {
    it("should return teams for the current user", async () => {
      mockPrisma.$runCommandRaw.mockResolvedValue({
        cursor: { firstBatch: [] },
      });
      mockPrisma.userTeam.findMany.mockResolvedValue([mockTeam]);
      mockPrisma.hackathonTeam.findMany.mockResolvedValue([]);

      jest
        .spyOn(service as any, "toDto")
        .mockImplementation(
          async (raw: any, userId: string, hackathonIds = []) => ({
            id: raw.id || "team-1",
            name: raw.name || "Test Team",
            ownerId: raw.ownerId || "user-1",
            joinCode: raw.joinCode || "ABC123",
            members: raw.members || [],
            joinRequests: raw.joinRequests || [],
            registeredHackathonIds: hackathonIds,
            createdAt: raw.createdAt || new Date(),
            updatedAt: raw.updatedAt || new Date(),
          }),
        );

      const result = await service.getMyTeams("user-1");

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getAllTeams", () => {
    it("should return all teams", async () => {
      mockPrisma.$runCommandRaw.mockResolvedValue({
        cursor: { firstBatch: [] },
      });
      mockPrisma.userTeam.findMany.mockResolvedValue([mockTeam]);
      mockPrisma.hackathonTeam.findMany.mockResolvedValue([]);

      jest
        .spyOn(service as any, "toDto")
        .mockImplementation(
          async (raw: any, userId: string, hackathonIds = []) => ({
            id: raw.id || "team-1",
            name: raw.name || "Test Team",
            ownerId: raw.ownerId || "user-1",
            joinCode: raw.joinCode || "ABC123",
            members: raw.members || [],
            joinRequests: raw.joinRequests || [],
            registeredHackathonIds: hackathonIds,
            createdAt: raw.createdAt || new Date(),
            updatedAt: raw.updatedAt || new Date(),
          }),
        );

      const result = await service.getAllTeams("user-1");

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getTeamById", () => {
    it("should return a team by id", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.hackathonTeam.findMany.mockResolvedValue([]);

      jest
        .spyOn(service as any, "toDto")
        .mockImplementation(
          async (raw: any, userId: string, hackathonIds = []) => ({
            id: raw.id || "team-1",
            name: raw.name || "Test Team",
            ownerId: raw.ownerId || "user-1",
            joinCode: raw.joinCode || "ABC123",
            members: raw.members || [],
            joinRequests: raw.joinRequests || [],
            registeredHackathonIds: hackathonIds,
            createdAt: raw.createdAt || new Date(),
            updatedAt: raw.updatedAt || new Date(),
          }),
        );

      const result = await service.getTeamById("team-1", "user-1");

      expect(result).toBeDefined();
      expect(result.id).toBe("team-1");
    });

    it("should throw NotFoundException when team not found", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(null);

      await expect(
        service.getTeamById("nonexistent", "user-1"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("inviteMember", () => {
    it("should invite a member successfully", async () => {
      const dto = { username: "newmember" };
      const targetUser = {
        id: "user-2",
        username: "newmember",
        profileImage: null,
      };
      const updatedTeam = {
        ...mockTeam,
        members: [
          mockTeam.members[0],
          {
            userId: "user-2",
            username: "newmember",
            role: "member",
            joinedAt: new Date(),
          },
        ],
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.user.findUnique.mockResolvedValue(targetUser);
      mockPrisma.userTeam.update.mockResolvedValue(updatedTeam);
      mockNotificationEmitter.emit.mockResolvedValue(undefined);

      jest
        .spyOn(service as any, "toDto")
        .mockImplementation(async (raw) => raw);

      const result = await service.inviteMember("team-1", "user-1", dto);

      expect(result).toBeDefined();
      expect(result.members).toHaveLength(2);
    });

    it("should throw BadRequestException when username is empty", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);

      await expect(
        service.inviteMember("team-1", "user-1", { username: "   " }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException when user not found", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.inviteMember("team-1", "user-1", { username: "nonexistent" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when user is already a member", async () => {
      const teamWithMember = {
        ...mockTeam,
        members: [
          {
            userId: "user-1",
            username: "testuser",
            role: "captain",
            joinedAt: new Date(),
          },
          {
            userId: "user-2",
            username: "newmember",
            role: "member",
            joinedAt: new Date(),
          },
        ],
      };
      const targetUser = {
        id: "user-2",
        username: "newmember",
        profileImage: null,
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(teamWithMember);
      mockPrisma.user.findUnique.mockResolvedValue(targetUser);

      await expect(
        service.inviteMember("team-1", "user-1", { username: "newmember" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when team is full", async () => {
      const fullTeam = {
        ...mockTeam,
        members: [
          {
            userId: "user-1",
            username: "testuser",
            role: "captain",
            joinedAt: new Date(),
          },
          {
            userId: "user-2",
            username: "member2",
            role: "member",
            joinedAt: new Date(),
          },
          {
            userId: "user-3",
            username: "member3",
            role: "member",
            joinedAt: new Date(),
          },
          {
            userId: "user-4",
            username: "member4",
            role: "member",
            joinedAt: new Date(),
          },
        ],
      };
      const targetUser = {
        id: "user-5",
        username: "newmember",
        profileImage: null,
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(fullTeam);
      mockPrisma.user.findUnique.mockResolvedValue(targetUser);

      await expect(
        service.inviteMember("team-1", "user-1", { username: "newmember" }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("removeMember", () => {
    it("should remove a member successfully", async () => {
      const teamWithMembers = {
        ...mockTeam,
        members: [
          {
            userId: "user-1",
            username: "testuser",
            role: "captain",
            joinedAt: new Date(),
          },
          {
            userId: "user-2",
            username: "member2",
            role: "member",
            joinedAt: new Date(),
          },
        ],
      };
      const updatedTeam = {
        ...teamWithMembers,
        members: [teamWithMembers.members[0]],
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(teamWithMembers);
      mockPrisma.userTeam.update.mockResolvedValue(updatedTeam);
      mockNotificationEmitter.emit.mockResolvedValue(undefined);

      const result = await service.removeMember("team-1", "user-1", "user-2");

      expect(result).toBeDefined();
      expect(result.members).toHaveLength(1);
    });

    it("should throw BadRequestException when owner tries to remove themselves", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);

      await expect(
        service.removeMember("team-1", "user-1", "user-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException when member not found", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);

      await expect(
        service.removeMember("team-1", "user-1", "user-999"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("leaveTeam", () => {
    it("should leave team successfully as regular member", async () => {
      const teamWithMembers = {
        ...mockTeam,
        members: [
          {
            userId: "user-1",
            username: "testuser",
            role: "captain",
            joinedAt: new Date(),
          },
          {
            userId: "user-2",
            username: "member2",
            role: "member",
            joinedAt: new Date(),
          },
        ],
      };
      const updatedTeam = {
        ...teamWithMembers,
        members: [teamWithMembers.members[0]],
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(teamWithMembers);
      mockPrisma.userTeam.update.mockResolvedValue(updatedTeam);
      mockNotificationEmitter.emit.mockResolvedValue(undefined);

      const result = await service.leaveTeam("team-1", "user-2");

      expect(result).toEqual({ message: "Left team successfully" });
    });

    it("should delete team when owner leaves and is alone", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.userTeam.delete.mockResolvedValue(mockTeam);
      mockNotificationEmitter.emit.mockResolvedValue(undefined);

      const result = await service.leaveTeam("team-1", "user-1");

      expect(result).toEqual({ message: "Team deleted successfully" });
      expect(mockPrisma.userTeam.delete).toHaveBeenCalled();
    });

    it("should throw BadRequestException when owner tries to leave with other members", async () => {
      const teamWithMembers = {
        ...mockTeam,
        members: [
          {
            userId: "user-1",
            username: "testuser",
            role: "captain",
            joinedAt: new Date(),
          },
          {
            userId: "user-2",
            username: "member2",
            role: "member",
            joinedAt: new Date(),
          },
        ],
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(teamWithMembers);

      await expect(service.leaveTeam("team-1", "user-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when user is not a member", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);

      await expect(service.leaveTeam("team-1", "user-999")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("deleteTeam", () => {
    it("should delete team successfully", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.userTeam.delete.mockResolvedValue(mockTeam);
      mockNotificationEmitter.emit.mockResolvedValue(undefined);

      const result = await service.deleteTeam("team-1", "user-1");

      expect(result).toEqual({ message: "Team deleted successfully" });
    });

    it("should throw BadRequestException when non-captain tries to delete", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);

      await expect(service.deleteTeam("team-1", "user-999")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("requestJoinByCode", () => {
    it("should find team and request to join", async () => {
      mockPrisma.userTeam.findFirst.mockResolvedValue(mockTeam);
      jest
        .spyOn(service, "requestToJoin")
        .mockResolvedValue({ message: "Join request sent" });

      const result = await service.requestJoinByCode("user-2", "ABC123");

      expect(result).toEqual({ message: "Join request sent" });
    });

    it("should throw NotFoundException when team code not found", async () => {
      mockPrisma.userTeam.findFirst.mockResolvedValue(null);

      await expect(
        service.requestJoinByCode("user-2", "INVALID"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("requestToJoin", () => {
    it("should send join request successfully", async () => {
      const updatedTeam = {
        ...mockTeam,
        joinRequests: [
          {
            userId: "user-2",
            username: "newuser",
            requestedAt: new Date(),
            status: "pending",
          },
        ],
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-2",
        username: "newuser",
        profileImage: null,
      });
      mockPrisma.userTeam.update.mockResolvedValue(updatedTeam);
      mockNotificationEmitter.emit.mockResolvedValue(undefined);

      const result = await service.requestToJoin("team-1", "user-2");

      expect(result).toEqual({ message: "Join request sent" });
    });

    it("should throw BadRequestException when already a member", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);

      await expect(service.requestToJoin("team-1", "user-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when pending request already exists", async () => {
      const teamWithRequest = {
        ...mockTeam,
        joinRequests: [
          {
            userId: "user-2",
            username: "newuser",
            requestedAt: new Date(),
            status: "pending",
          },
        ],
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(teamWithRequest);

      await expect(service.requestToJoin("team-1", "user-2")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("getPendingRequests", () => {
    it("should return pending requests", async () => {
      const teamWithRequests = {
        ...mockTeam,
        joinRequests: [
          {
            userId: "user-2",
            username: "newuser",
            requestedAt: new Date(),
            status: "pending",
          },
        ],
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(teamWithRequests);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-2",
        username: "newuser",
        profileImage: null,
      });

      const result = await service.getPendingRequests("team-1", "user-1");

      expect(result).toBeDefined();
    });

    it("should throw BadRequestException when non-captain tries to view requests", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);

      await expect(
        service.getPendingRequests("team-1", "user-999"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("approveJoinRequest", () => {
    it("should approve join request successfully", async () => {
      const teamWithRequest = {
        ...mockTeam,
        joinRequests: [
          {
            userId: "user-2",
            username: "newuser",
            requestedAt: new Date(),
            status: "pending",
          },
        ],
      };
      const updatedTeam = {
        ...teamWithRequest,
        members: [
          ...teamWithRequest.members,
          {
            userId: "user-2",
            username: "newuser",
            role: "member",
            joinedAt: new Date(),
          },
        ],
        joinRequests: [],
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(teamWithRequest);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-2",
        username: "newuser",
        profileImage: null,
      });
      mockPrisma.userTeam.update.mockResolvedValue(updatedTeam);
      mockPrisma.hackathonTeam.findMany.mockResolvedValue([]);
      mockNotificationEmitter.emit.mockResolvedValue(undefined);

      const result = await service.approveJoinRequest(
        "team-1",
        "user-1",
        "user-2",
      );

      expect(result).toBeDefined();
    });

    it("should throw NotFoundException when no pending request found", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);

      await expect(
        service.approveJoinRequest("team-1", "user-1", "user-2"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when team is full", async () => {
      const fullTeam = {
        ...mockTeam,
        members: [
          {
            userId: "user-1",
            username: "testuser",
            role: "captain",
            joinedAt: new Date(),
          },
          {
            userId: "user-2",
            username: "member2",
            role: "member",
            joinedAt: new Date(),
          },
          {
            userId: "user-3",
            username: "member3",
            role: "member",
            joinedAt: new Date(),
          },
          {
            userId: "user-4",
            username: "member4",
            role: "member",
            joinedAt: new Date(),
          },
        ],
        joinRequests: [
          {
            userId: "user-5",
            username: "newuser",
            requestedAt: new Date(),
            status: "pending",
          },
        ],
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(fullTeam);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-5",
        username: "newuser",
        profileImage: null,
      });

      await expect(
        service.approveJoinRequest("team-1", "user-1", "user-5"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("rejectJoinRequest", () => {
    it("should reject join request successfully", async () => {
      const teamWithRequest = {
        ...mockTeam,
        joinRequests: [
          {
            userId: "user-2",
            username: "newuser",
            requestedAt: new Date(),
            status: "pending",
          },
        ],
      };
      const updatedTeam = {
        ...teamWithRequest,
        joinRequests: [],
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(teamWithRequest);
      mockPrisma.userTeam.update.mockResolvedValue(updatedTeam);
      mockNotificationEmitter.emit.mockResolvedValue(undefined);

      const result = await service.rejectJoinRequest(
        "team-1",
        "user-1",
        "user-2",
      );

      expect(result).toEqual({ message: "Join request rejected" });
    });

    it("should throw NotFoundException when no pending request found", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);

      await expect(
        service.rejectJoinRequest("team-1", "user-1", "user-2"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("registerToHackathon", () => {
    it("should register team to hackathon successfully", async () => {
      const hackathon = {
        id: "hack-1",
        title: "Test Hackathon",
        status: "lobby",
        scope: "open",
        teamPolicy: { minSize: 1, maxSize: 4 },
      };
      const registration = {
        id: "reg-1",
        hackathonId: "hack-1",
        name: "Test Team",
      };

      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.hackathon.findUnique.mockResolvedValue(hackathon);
      mockPrisma.hackathonTeam.findMany.mockResolvedValue([]);
      mockPrisma.hackathonTeam.create.mockResolvedValue(registration);
      mockNotificationEmitter.emit.mockResolvedValue(undefined);

      const result = await service.registerToHackathon(
        "team-1",
        "hack-1",
        "user-1",
      );

      expect(result).toBeDefined();
      expect(result.hackathonId).toBe("hack-1");
    });

    it("should throw NotFoundException when hackathon not found", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.hackathon.findUnique.mockResolvedValue(null);

      await expect(
        service.registerToHackathon("team-1", "hack-1", "user-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when non-captain tries to register", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.hackathon.findUnique.mockResolvedValue({
        id: "hack-1",
        status: "lobby",
        scope: "open",
      });

      await expect(
        service.registerToHackathon("team-1", "hack-1", "user-999"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when hackathon registration is closed", async () => {
      mockPrisma.userTeam.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.hackathon.findUnique.mockResolvedValue({
        id: "hack-1",
        status: "completed",
        scope: "open",
      });

      await expect(
        service.registerToHackathon("team-1", "hack-1", "user-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
