/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'auth/auth.service.ts',
    'submissions/submissions.service.ts',
    'submissions/submissions.controller.ts',
    'notifications/notifications.service.ts',
    'notifications/notifications.controller.ts',
    'notifications/notification-emitter.service.ts',
    'queue/queue.service.ts',
    'intelligence/intelligence.service.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test-logger.setup.ts'],
};
