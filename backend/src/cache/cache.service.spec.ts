import { ConfigService } from "@nestjs/config";
import { CacheService } from "./cache.service";

jest.mock("ioredis", () => ({
  __esModule: true,
  default: jest.fn(),
}));
const RedisMock = jest.requireMock("ioredis").default as jest.Mock;

describe("CacheService", () => {
  const createConfigService = (values: Record<string, any> = {}) =>
    ({
      get: jest.fn((key: string, defaultValue?: any) =>
        key in values ? values[key] : defaultValue,
      ),
    }) as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does nothing when Redis is disabled", async () => {
    const configService = createConfigService({ REDIS_ENABLED: "false" });
    const service = new CacheService(configService);

    expect(RedisMock).not.toHaveBeenCalled();
    expect(await service.get("key")).toBeNull();

    await expect(
      service.set("key", { hello: "world" }),
    ).resolves.toBeUndefined();
    await expect(service.del("key")).resolves.toBeUndefined();
    await expect(service.deleteByPattern("user:*")).resolves.toBeUndefined();
  });

  it("initializes Redis with configured connection values", async () => {
    const redisInstance = {
      on: jest.fn(),
      get: jest.fn().mockResolvedValue(JSON.stringify({ value: 1 })),
      set: jest.fn().mockResolvedValue("OK"),
      setex: jest.fn().mockResolvedValue("OK"),
      del: jest.fn().mockResolvedValue(1),
      quit: jest.fn(),
      scanStream: jest.fn(),
      pipeline: jest.fn(),
    };
    RedisMock.mockImplementation(() => redisInstance);

    const configService = createConfigService({
      REDIS_ENABLED: "true",
      REDIS_HOST: "redis.local",
      REDIS_PORT: 6380,
      REDIS_PASSWORD: "secret",
    });

    const service = new CacheService(configService);
    service.onModuleInit();

    expect(RedisMock).toHaveBeenCalledWith({
      host: "redis.local",
      port: 6380,
      password: "secret",
      maxRetriesPerRequest: null,
    });
    expect(redisInstance.on).toHaveBeenCalledWith(
      "error",
      expect.any(Function),
    );

    await expect(service.get<{ value: number }>("cache:key")).resolves.toEqual({
      value: 1,
    });
    await expect(
      service.set("cache:key", { value: 2 }, 30),
    ).resolves.toBeUndefined();
    await expect(
      service.set("cache:key", { value: 3 }),
    ).resolves.toBeUndefined();
    await expect(service.del("cache:key")).resolves.toBeUndefined();

    expect(redisInstance.get).toHaveBeenCalledWith("cache:key");
    expect(redisInstance.setex).toHaveBeenCalledWith(
      "cache:key",
      30,
      JSON.stringify({ value: 2 }),
    );
    expect(redisInstance.set).toHaveBeenCalledWith(
      "cache:key",
      JSON.stringify({ value: 3 }),
    );
    expect(redisInstance.del).toHaveBeenCalledWith("cache:key");

    service.onModuleDestroy();
    expect(redisInstance.quit).toHaveBeenCalled();
  });

  it("deletes keys by pattern using scanStream and pipeline", async () => {
    const dataHandlerCallbacks: Array<
      (keys: string[]) => Promise<void> | void
    > = [];
    const pipeline = {
      del: jest.fn(),
      exec: jest.fn().mockResolvedValue([]),
    };
    const scanStream = {
      on: jest.fn(
        (event: string, handler: (keys: string[]) => Promise<void> | void) => {
          if (event === "data") {
            dataHandlerCallbacks.push(handler);
          }
          return scanStream;
        },
      ),
    };
    const redisInstance = {
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      quit: jest.fn(),
      scanStream: jest.fn().mockReturnValue(scanStream),
      pipeline: jest.fn().mockReturnValue(pipeline),
    };
    RedisMock.mockImplementation(() => redisInstance);

    const service = new CacheService(createConfigService());
    service.onModuleInit();

    await service.deleteByPattern("leaderboard:*");

    expect(redisInstance.scanStream).toHaveBeenCalledWith({
      match: "leaderboard:*",
      count: 100,
    });
    expect(dataHandlerCallbacks).toHaveLength(1);

    await dataHandlerCallbacks[0](["key-1", "key-2"]);

    expect(redisInstance.pipeline).toHaveBeenCalledTimes(1);
    expect(pipeline.del).toHaveBeenCalledWith("key-1");
    expect(pipeline.del).toHaveBeenCalledWith("key-2");
    expect(pipeline.exec).toHaveBeenCalled();
  });
});
