FROM python:3.11-slim

# System dependencies for document processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (required by HF Spaces)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /home/user/app

# Install Python dependencies first (cached layer)
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=user . .

# Create data directories
RUN mkdir -p data/uploads data/vectordb

# HF Spaces uses port 7860 by default
EXPOSE 7860

# Start command — HF Spaces expects port 7860
CMD uvicorn api:app --host 0.0.0.0 --port 7860 --workers 1
