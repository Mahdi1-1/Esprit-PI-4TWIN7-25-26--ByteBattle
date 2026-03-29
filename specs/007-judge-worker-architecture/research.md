# Research: Judge Worker Architecture

## Topics Researched

### 1. BullMQ Integration for NestJS
**Unknown**: What is the standard/recommended package for integrating BullMQ with NestJS?
**Finding**: NestJS officially provides `@nestjs/bullmq` (distinct from `@nestjs/bull` which uses the older Bull library).
**Decision**: Use `@nestjs/bullmq` and `bullmq` packages.
**Rationale**: `bullmq` is the modern, actively maintained version of Bull, written in TypeScript, and provides better performance and features (like flows and sandboxed processors).
**Alternatives considered**: `@nestjs/bull` (deprecated/older), RabbitMQ (heavier infrastructure, Redis is already required for Leaderboard/Cache).

### 2. Testing Docker Interactions
**Unknown**: How to test components that interact with the Docker daemon (SandboxService) in CI/CD?
**Finding**: True unit tests should mock the Docker client (e.g., using `jest.mock('dockerode')`). Integration tests require a Docker-in-Docker setup or a real Docker daemon available in the CI runner.
**Decision**: 
1. Unit tests: Mock `Dockerode` to test service logic, timeout handling, and parsing of evaluation results.
2. Integration tests (optional/local): Run against a real local Docker daemon.
**Rationale**: Mocking ensures CI tests are fast, reliable, and run in environments where Docker might not be accessible. 
**Alternatives considered**: Testcontainers (adds overhead and complexity, overkill when we just need to verify our wrapper logic).
