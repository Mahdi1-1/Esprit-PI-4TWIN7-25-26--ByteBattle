# ── ByteBattle Sandbox: Java 21 (Eclipse Temurin) ─────────────
# Minimal, secure image for compiling & executing user-submitted Java code.

FROM eclipse-temurin:21-jdk-alpine

# Create non-root sandbox user
RUN addgroup -S sandbox && adduser -S sandboxuser -G sandbox

# Working directory (will be tmpfs-mounted at runtime)
WORKDIR /tmp/code

USER sandboxuser

# Default entrypoint: bash (compile + run via command)
ENTRYPOINT ["/bin/sh", "-c"]
