import { ServiceUnavailableException } from "@nestjs/common";
import { IntelligenceService } from "./intelligence.service";

describe("IntelligenceService", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("posts telemetry to the submit endpoint", async () => {
    process.env.INTELLIGENCE_ENGINE_URL = "http://engine/";

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ user_id: "u1" }),
    });
    (global as any).fetch = fetchMock;

    const service = new IntelligenceService();

    await service.getSubmitDecision({
      user_id: "u1",
      challenge_id: "c1",
      challenge_name: "Two Sum",
      difficulty: 2,
      cf_rating: 1200,
      minutes_stuck: 1,
      attempts_count: 1,
      last_hint_level: 0,
      challenge_tags: ["array"],
      code_lines: 10,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://engine/submit",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("throws ServiceUnavailableException when engine fails", async () => {
    process.env.INTELLIGENCE_ENGINE_URL = "http://engine";

    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: jest.fn().mockResolvedValue("down"),
    });
    (global as any).fetch = fetchMock;

    const service = new IntelligenceService();

    await expect(
      service.getHintPolicy({
        user_id: "u1",
        challenge_id: "c1",
        challenge_name: "Two Sum",
        difficulty: 2,
        cf_rating: 1200,
        minutes_stuck: 1,
        attempts_count: 1,
        last_hint_level: 0,
        challenge_tags: ["array"],
        code_lines: 10,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("uses default engine URL when env is missing", async () => {
    delete process.env.INTELLIGENCE_ENGINE_URL;
    delete process.env.ML_SERVICE_URL;

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ ok: true }),
    });
    (global as any).fetch = fetchMock;

    const service = new IntelligenceService();

    await service.getProfile({
      user_id: "u1",
      challenge_id: "c1",
      challenge_name: "Two Sum",
      difficulty: 2,
      cf_rating: 1200,
      minutes_stuck: 1,
      attempts_count: 1,
      last_hint_level: 0,
      challenge_tags: ["array"],
      code_lines: 10,
      current_skills: { algo: 50 },
      top_k: 3,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://intelligence-engine:8001/profile",
      expect.any(Object),
    );
  });
});
