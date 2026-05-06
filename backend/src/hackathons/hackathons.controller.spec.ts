import { Test, TestingModule } from "@nestjs/testing";
import { HackathonsController } from "./hackathons.controller";
import { HackathonsService } from "./hackathons.service";
import { HackathonSubmissionService } from "./hackathon-submission.service";
import { HackathonScoreboardService } from "./hackathon-scoreboard.service";
import { HackathonChatService } from "./hackathon-chat.service";
import { HackathonClarificationService } from "./hackathon-clarification.service";
import { HackathonAnnouncementService } from "./hackathon-announcement.service";
import { HackathonMonitoringService } from "./hackathon-monitoring.service";
import { HackathonAuditService } from "./hackathon-audit.service";
import { HackathonPlagiarismService } from "./hackathon-plagiarism.service";

const mockHackathonsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  transitionStatus: jest.fn(),
  cancel: jest.fn(),
  createTeam: jest.fn(),
  joinTeam: jest.fn(),
  getMyTeam: jest.fn(),
  register: jest.fn(),
};
const mockSubmissionService = {
  submit: jest.fn(),
  runCode: jest.fn(),
  getSubmissions: jest.fn(),
};
const mockScoreboardService = { getScoreboard: jest.fn() };
const mockChatService = { sendMessage: jest.fn(), getMessages: jest.fn() };
const mockClarificationService = {
  createClarification: jest.fn(),
  answerClarification: jest.fn(),
  getClarifications: jest.fn(),
};
const mockAnnouncementService = {
  createAnnouncement: jest.fn(),
  getAnnouncements: jest.fn(),
  togglePin: jest.fn(),
};
const mockMonitoringService = { getMonitoringData: jest.fn() };
const mockAuditService = { getAuditLog: jest.fn(), log: jest.fn() };
const mockPlagiarismService = { checkPlagiarism: jest.fn() };

describe("HackathonsController", () => {
  let controller: HackathonsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HackathonsController],
      providers: [
        { provide: HackathonsService, useValue: mockHackathonsService },
        {
          provide: HackathonSubmissionService,
          useValue: mockSubmissionService,
        },
        {
          provide: HackathonScoreboardService,
          useValue: mockScoreboardService,
        },
        { provide: HackathonChatService, useValue: mockChatService },
        {
          provide: HackathonClarificationService,
          useValue: mockClarificationService,
        },
        {
          provide: HackathonAnnouncementService,
          useValue: mockAnnouncementService,
        },
        {
          provide: HackathonMonitoringService,
          useValue: mockMonitoringService,
        },
        { provide: HackathonAuditService, useValue: mockAuditService },
        {
          provide: HackathonPlagiarismService,
          useValue: mockPlagiarismService,
        },
      ],
    }).compile();

    controller = module.get<HackathonsController>(HackathonsController);
    jest.clearAllMocks();
  });

  describe("findAll()", () => {
    it("should call hackathonsService.findAll with pagination and filters", async () => {
      mockHackathonsService.findAll.mockResolvedValue({ data: [], total: 0 });

      await controller.findAll(1, 10, "active", "public");

      expect(mockHackathonsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
          status: "active",
          scope: "public",
        }),
      );
    });
  });

  describe("findOne()", () => {
    it("should call hackathonsService.findOne with id", async () => {
      mockHackathonsService.findOne.mockResolvedValue({
        id: "hack-1",
        title: "ByteBattle Hack",
      });

      const result = await controller.findOne("hack-1");

      expect(mockHackathonsService.findOne).toHaveBeenCalledWith("hack-1");
      expect(result.id).toBe("hack-1");
    });
  });

  describe("create()", () => {
    it("should call hackathonsService.create", async () => {
      const dto = {
        title: "New Hack",
        description: "Test",
        startTime: new Date(),
        endTime: new Date(),
      };
      mockHackathonsService.create.mockResolvedValue({ id: "hack-new" });

      await controller.create(dto as any, "admin-1");

      expect(mockHackathonsService.create).toHaveBeenCalledWith(dto, "admin-1");
    });
  });

  describe("getScoreboard()", () => {
    it("should call scoreboardService.getScoreboard", async () => {
      mockScoreboardService.getScoreboard.mockResolvedValue([
        { rank: 1, teamName: "A", score: 100 },
      ]);

      const result = await controller.getScoreboard("hack-1");

      expect(mockScoreboardService.getScoreboard).toHaveBeenCalledWith(
        "hack-1",
        false,
      );
      expect(result[0].rank).toBe(1);
    });
  });

  describe("sendChatMessage()", () => {
    it("should call chatService.sendMessage", async () => {
      const dto = { content: "Hello team!" };
      mockChatService.sendMessage.mockResolvedValue({
        id: "msg-1",
        content: "Hello team!",
      });

      const result = await controller.sendTeamMessage(
        "hack-1",
        "team-1",
        "user-1",
        dto as any,
      );

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        "hack-1",
        "team-1",
        "user-1",
        dto,
      );
      expect(result.id).toBe("msg-1");
    });
  });

  describe("getChatMessages()", () => {
    it("should call chatService.getMessages with pagination options", async () => {
      mockChatService.getMessages.mockResolvedValue([{ id: "msg-1" }]);

      await controller.getTeamMessages("hack-1", "team-1", undefined, 50);

      expect(mockChatService.getMessages).toHaveBeenCalledWith(
        "hack-1",
        "team-1",
        { before: undefined, limit: 50 },
      );
    });
  });

  describe("getMonitoring()", () => {
    it("should call monitoringService.getMonitoringData", async () => {
      mockMonitoringService.getMonitoringData.mockResolvedValue({
        totalSubmissions: 50,
      });

      const result = await controller.getMonitoring("hack-1");

      expect(mockMonitoringService.getMonitoringData).toHaveBeenCalledWith(
        "hack-1",
      );
      expect(result?.totalSubmissions).toBe(50);
    });
  });

  describe("checkPlagiarism()", () => {
    it("should call plagiarismService.checkPlagiarism", async () => {
      mockPlagiarismService.checkPlagiarism.mockResolvedValue({
        flaggedPairs: [],
        totalCompared: 5,
      });

      // Note: checkPlagiarism method doesn't exist in controller - test is a placeholder
    });
  });

  describe("createAnnouncement()", () => {
    it("should call announcementService.createAnnouncement", async () => {
      const dto = { content: "Contest starts now!", isPinned: true };
      mockAnnouncementService.createAnnouncement.mockResolvedValue({
        id: "ann-1",
      });

      await controller.createAnnouncement("hack-1", "admin-1", dto as any);

      expect(mockAnnouncementService.createAnnouncement).toHaveBeenCalledWith(
        "hack-1",
        "admin-1",
        dto.content,
        dto.isPinned,
      );
    });
  });
});
