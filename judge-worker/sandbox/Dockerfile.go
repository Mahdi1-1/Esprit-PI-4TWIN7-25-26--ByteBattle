# ── ByteBattle Sandbox: Go 1.22 (Alpine) ─────────────────────
# Minimal, secure image for compiling & executing user-submitted Go code.

FROM golang:1.22-alpine

# Create non-root sandbox user
RUN addgroup -S sandbox && adduser -S sandboxuser -G sandbox

# Working directory (will be tmpfs-mounted at runtime)
WORKDIR /tmp/code

USER sandboxuser

# Default entrypoint: sh (compile + run via command)
ENTRYPOINT ["/bin/sh", "-c"]
