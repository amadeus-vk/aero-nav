FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend and frontend
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Force invalidate cache for assets
RUN echo "Asset update $(date +%s)" > /tmp/cache_buster

EXPOSE 8000

ENV PYTHONPATH=/app

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
