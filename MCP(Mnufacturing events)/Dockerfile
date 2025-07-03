# syntax=docker/dockerfile:1

FROM python:3.11-slim AS base

# Set workdir for all stages
WORKDIR /app

# --- Builder stage ---
FROM base AS builder

# Install system dependencies required for psycopg2 and other packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy only requirements.txt first for better cache usage
COPY --link requirements.txt ./

# Create virtual environment and install dependencies using pip cache
RUN python -m venv .venv && \
    .venv/bin/pip install --upgrade pip && \
    --mount=type=cache,target=/root/.cache/pip \
    .venv/bin/pip install -r requirements.txt

# Copy the rest of the application code (excluding files in .dockerignore)
COPY --link . .

# --- Final stage ---
FROM base AS final

# Create a non-root user
RUN useradd -m appuser
USER appuser

# Copy app source and venv from builder
COPY --from=builder /app /app
COPY --from=builder /app/.venv /app/.venv

# Set environment so venv is used by default
ENV PATH="/app/.venv/bin:$PATH"

# Expose the default FastAPI port
EXPOSE 8000

# Entrypoint to run the FastAPI app with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
