// ─────────────────────────────────────────────────────────────────────────────
// CompaniesController
// ─────────────────────────────────────────────────────────────────────────────
import { Test, TestingModule } from "@nestjs/testing";
import { CompaniesController } from "./companies.controller";
import { CompaniesService } from "./companies.service";
import { BadRequestException } from "@nestjs/common";

const mockCompaniesService = {
  getPublicCompanies: jest.fn(),
  getPublicJobs: jest.fn(),
  createCompany: jest.fn(),
  getCompany: jest.fn(),
  updateCompany: jest.fn(),
  deleteCompany: jest.fn(),
  inviteMember: jest.fn(),
  joinByCode: jest.fn(),
  getMembers: jest.fn(),
  removeMember: jest.fn(),
  updateMemberRole: jest.fn(),
  getMyCompany: jest.fn(),
  createRoadmap: jest.fn(),
  getRoadmaps: jest.fn(),
  createJob: jest.fn(),
  getJobs: jest.fn(),
  createForumGroup: jest.fn(),
  getForumGroups: jest.fn(),
  createForumPost: jest.fn(),
  getForumPosts: jest.fn(),
};

describe("CompaniesController", () => {
  let controller: CompaniesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        { provide: CompaniesService, useValue: mockCompaniesService },
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
    jest.clearAllMocks();
  });

  describe("getPublicCompanies()", () => {
    it("should return public companies", async () => {
      mockCompaniesService.getPublicCompanies.mockResolvedValue([
        { id: "co-1", name: "Acme" },
      ]);
      const result = await controller.getPublicCompanies();
      expect(mockCompaniesService.getPublicCompanies).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe("getPublicJobs()", () => {
    it("should return public jobs", async () => {
      mockCompaniesService.getPublicJobs.mockResolvedValue([
        { id: "job-1", title: "Dev" },
      ]);
      const result = await controller.getPublicJobs();
      expect(mockCompaniesService.getPublicJobs).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe("createCompany()", () => {
    it("should throw BadRequestException when user is not authenticated", async () => {
      const dto = { name: "Acme", slug: "acme" };
      await expect(controller.createCompany(dto as any, null)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should call createCompany with userId and dto", async () => {
      const dto = { name: "Acme", slug: "acme" };
      mockCompaniesService.createCompany.mockResolvedValue({
        id: "co-1",
        name: "Acme",
      });
      const result = await controller.createCompany(dto as any, {
        id: "user-1",
      });
      expect(mockCompaniesService.createCompany).toHaveBeenCalledWith(
        "user-1",
        dto,
      );
      expect(result.id).toBe("co-1");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TeamsController
// ─────────────────────────────────────────────────────────────────────────────
import { TeamsController } from "../teams/teams.controller";
import { TeamsService } from "../teams/teams.service";

const mockTeamsService = {
  createTeam: jest.fn(),
  getMyTeams: jest.fn(),
  getAllTeams: jest.fn(),
  requestJoinByCode: jest.fn(),
  acceptJoinRequest: jest.fn(),
  declineJoinRequest: jest.fn(),
  leaveTeam: jest.fn(),
  getTeam: jest.fn(),
  inviteMember: jest.fn(),
};

describe("TeamsController", () => {
  let controller: TeamsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [{ provide: TeamsService, useValue: mockTeamsService }],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
    jest.clearAllMocks();
  });

  describe("createTeam()", () => {
    it("should call teamsService.createTeam with userId and dto", async () => {
      const dto = { name: "Alpha" };
      mockTeamsService.createTeam.mockResolvedValue({
        id: "team-1",
        name: "Alpha",
      });

      const result = await controller.createTeam(dto as any, { id: "user-1" });

      expect(mockTeamsService.createTeam).toHaveBeenCalledWith("user-1", dto);
      expect(result.id).toBe("team-1");
    });
  });

  describe("getMine()", () => {
    it("should return teams for current user", async () => {
      mockTeamsService.getMyTeams.mockResolvedValue([{ id: "team-1" }]);

      const result = await controller.getMine({ id: "user-1" });

      expect(mockTeamsService.getMyTeams).toHaveBeenCalledWith("user-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getAll()", () => {
    it("should return all teams", async () => {
      mockTeamsService.getAllTeams.mockResolvedValue([
        { id: "team-1" },
        { id: "team-2" },
      ]);

      const result = await controller.getAll({ id: "user-1" });

      expect(mockTeamsService.getAllTeams).toHaveBeenCalledWith("user-1");
      expect(result).toHaveLength(2);
    });
  });

  describe("requestJoinByCode()", () => {
    it("should call requestJoinByCode with userId and joinCode", async () => {
      mockTeamsService.requestJoinByCode.mockResolvedValue({ success: true });

      const result = await controller.requestJoinByCode(
        { joinCode: "ABC123" },
        { id: "user-1" },
      );

      expect(mockTeamsService.requestJoinByCode).toHaveBeenCalledWith(
        "user-1",
        "ABC123",
      );
      const r: any = result;
      // controller may return { success: true } or { message: '...' }, accept either shape
      expect(r.success === true || typeof r.message === "string").toBeTruthy();
    });
  });
});
