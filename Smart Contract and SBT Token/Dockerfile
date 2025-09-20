# syntax=docker/dockerfile:1

# Use slim Python, add Node for brownie/ganache; keep image lean
FROM python:3.11-slim

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# System deps: build tools for python deps and netcat for health/wait
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git build-essential netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install Brownie (via pip) and eth-brownie dependencies
RUN pip install --no-cache-dir eth-brownie==1.20.5

# Copy project files
COPY brownie-config.yaml ./
COPY contracts ./contracts
COPY scripts ./scripts
COPY build ./build
COPY interfaces ./interfaces
COPY offchain/requirements.txt ./offchain/requirements.txt

# Optional: install python offchain deps if needed for tooling
RUN pip install --no-cache-dir -r offchain/requirements.txt || true

# Include the offchain API code (FastAPI)
COPY offchain ./offchain

ENV PATH="/root/.local/bin:${PATH}"

# Default command keeps the container idle so compose can run commands
CMD ["bash", "-lc", "sleep infinity"]
