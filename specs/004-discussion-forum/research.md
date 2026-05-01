# Research: Discussion Forum

**Date**: 2026-03-25  
**Feature**: 004-discussion-forum

## Resolved Decisions

### 1. Notification Delivery Architecture

**Decision**: Dedicated `NotificationsGateway` with `/notifications` namespace  
**Rationale**: Separation of concerns — notifications are cross-cutting. Users connect on app load.  
**Alternatives considered**: Single shared gateway → rejected (couples duel + notification logic, violates Principle I)

### 2. Category Storage

**Decision**: String field with DTO-level validation (`@IsIn(validCategories)`)  
**Rationale**: MongoDB Prisma doesn't handle enums with defaults cleanly. String + validation is flexible.  
**Alternatives considered**: Prisma enum → rejected for MongoDB compatibility.

### 3. Rate Limiting

**Decision**: `@nestjs/throttler` module  
**Rationale**: In NestJS ecosystem, config-based, supports per-route customization.  
**Alternatives considered**: Custom middleware → more boilerplate, same result.

### 4. Flag/Report System

**Decision**: `flags` String[] + `isHidden` Boolean on Discussion and Comment models  
**Rationale**: Same array pattern as upvotes/downvotes — consistent and simple.  
**Alternatives considered**: Separate Report model → over-engineered for v1.

### 5. Notification Retention

**Decision**: Cap at 100 per user, delete oldest when creating new  
**Rationale**: Bounded storage, predictable performance. User-chosen during clarification.

### 6. Concurrent Edit Handling

**Decision**: Last write wins  
**Rationale**: Forum post editing is single-author, very rare concurrent case. Simplest approach.

## No Outstanding NEEDS CLARIFICATION

All unknowns resolved via `/speckit.clarify` (5 questions answered).
