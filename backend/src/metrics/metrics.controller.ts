import { Controller, Get, Header } from "@nestjs/common";

@Controller("metrics")
export class MetricsController {
  @Get()
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  getMetrics(): string {
    const memory = process.memoryUsage();
    const now = Date.now();

    return [
      "# HELP bytebattle_backend_up Backend process availability",
      "# TYPE bytebattle_backend_up gauge",
      "bytebattle_backend_up 1",
      "# HELP bytebattle_backend_uptime_seconds Backend process uptime in seconds",
      "# TYPE bytebattle_backend_uptime_seconds gauge",
      `bytebattle_backend_uptime_seconds ${process.uptime()}`,
      "# HELP process_resident_memory_bytes Resident memory size in bytes",
      "# TYPE process_resident_memory_bytes gauge",
      `process_resident_memory_bytes ${memory.rss}`,
      "# HELP process_heap_used_bytes V8 heap used in bytes",
      "# TYPE process_heap_used_bytes gauge",
      `process_heap_used_bytes ${memory.heapUsed}`,
      "# HELP process_heap_total_bytes V8 heap total in bytes",
      "# TYPE process_heap_total_bytes gauge",
      `process_heap_total_bytes ${memory.heapTotal}`,
      "# HELP process_external_memory_bytes External memory in bytes",
      "# TYPE process_external_memory_bytes gauge",
      `process_external_memory_bytes ${memory.external}`,
      "# HELP process_start_time_milliseconds Process start time since unix epoch in milliseconds",
      "# TYPE process_start_time_milliseconds gauge",
      `process_start_time_milliseconds ${now - Math.round(process.uptime() * 1000)}`,
      "",
    ].join("\n");
  }
}
