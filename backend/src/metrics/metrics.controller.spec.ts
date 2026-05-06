import { MetricsController } from "./metrics.controller";
import { MetricsModule } from "./metrics.module";

describe("MetricsController", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds a Prometheus metrics payload", () => {
    jest.spyOn(process, "memoryUsage").mockReturnValue({
      rss: 123,
      heapUsed: 456,
      heapTotal: 789,
      external: 10,
      arrayBuffers: 0,
    });
    jest.spyOn(process, "uptime").mockReturnValue(12.34);
    jest.spyOn(Date, "now").mockReturnValue(100000);

    const controller = new MetricsController();
    const output = controller.getMetrics();

    expect(output).toContain("bytebattle_backend_up 1");
    expect(output).toContain("bytebattle_backend_uptime_seconds 12.34");
    expect(output).toContain("process_resident_memory_bytes 123");
    expect(output).toContain("process_heap_used_bytes 456");
    expect(output).toContain("process_heap_total_bytes 789");
    expect(output).toContain("process_external_memory_bytes 10");
    expect(output).toContain("process_start_time_milliseconds 87660");
  });

  it("exposes MetricsModule", () => {
    expect(MetricsModule).toBeDefined();
  });
});
