import { InterviewsController } from "./interviews.controller";

const mockInterviewsService = {
  getDomains: jest.fn(),
  start: jest.fn(),
  sendMessage: jest.fn(),
  endInterview: jest.fn(),
  sendVoiceMessage: jest.fn(),
  getSession: jest.fn(),
  getUserSessions: jest.fn(),
};

describe("InterviewsController", () => {
  let controller: InterviewsController;

  beforeEach(async () => {
    // Avoid importing InterviewsService implementation (and its dependencies like voice/uuid).
    // Instantiate controller directly with mock service to keep tests isolated.
    controller = new InterviewsController(mockInterviewsService as any);
    jest.clearAllMocks();
  });

  describe("start()", () => {
    it("should call interviewsService.start with userId and dto", async () => {
      const dto = {
        domain: "SOFTWARE_ENGINEERING",
        difficulty: "medium",
        language: "en",
      };
      mockInterviewsService.start.mockResolvedValue({
        id: "session-1",
        status: "active",
      });

      const result = await controller.start("user-1", dto as any);

      expect(mockInterviewsService.start).toHaveBeenCalledWith("user-1", dto);
      expect(result.id).toBe("session-1");
    });
  });

  describe("sendMessage()", () => {
    it("should call interviewsService.sendMessage", async () => {
      const dto = { content: "Hello" };
      mockInterviewsService.sendMessage.mockResolvedValue({ reply: "Hi!" });

      const result = await controller.sendMessage(
        "session-1",
        "user-1",
        dto as any,
      );

      expect(mockInterviewsService.sendMessage).toHaveBeenCalledWith(
        "session-1",
        "user-1",
        dto,
      );
      const r: any = result;
      expect(r.reply).toBe("Hi!");
    });
  });

  describe("endInterview()", () => {
    it("should call interviewsService.endInterview", async () => {
      mockInterviewsService.endInterview.mockResolvedValue({
        feedback: { score: 75 },
      });

      const result = await controller.endInterview("session-1", "user-1");

      expect(mockInterviewsService.endInterview).toHaveBeenCalledWith(
        "session-1",
        "user-1",
      );
      const r: any = result;
      expect(r.feedback.score).toBe(75);
    });
  });
});
