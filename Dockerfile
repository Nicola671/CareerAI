FROM python:3.11-slim

# System dependencies for document processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p data/uploads data/vectordb

# Expose port (Render sets $PORT automatically)
EXPOSE 8000

# Start command — Render sets PORT env var
CMD uvicorn api:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
