# ── ByteBattle Sandbox: C++ / GCC (Alpine) ───────────────────
# Minimal, secure image for compiling & executing user-submitted C++ code.

FROM gcc:13-bookworm AS base

# Install only what's needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    time \
    && rm -rf /var/lib/apt/lists/*

# Create non-root sandbox user
RUN groupadd -r sandbox && useradd -r -g sandbox sandboxuser

# Working directory (will be tmpfs-mounted at runtime)
WORKDIR /tmp/code

USER sandboxuser

# Default entrypoint: bash (compile + run via command)
ENTRYPOINT ["/bin/bash", "-c"]
