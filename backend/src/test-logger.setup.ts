import { Logger } from "@nestjs/common";

const mutedLoggerMethods = [
  "error",
  "warn",
  "log",
  "debug",
  "verbose",
] as const;
type MutedLoggerMethod = (typeof mutedLoggerMethods)[number];

const spies: jest.SpyInstance[] = [];

beforeEach(() => {
  for (const method of mutedLoggerMethods) {
    spies.push(
      jest
        .spyOn(Logger.prototype, method as MutedLoggerMethod)
        .mockImplementation(() => undefined),
    );
  }
});

afterEach(() => {
  while (spies.length > 0) {
    spies.pop()?.mockRestore();
  }
});
