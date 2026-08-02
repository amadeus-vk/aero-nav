# Aero-Nav Interactive Calculator

A playful, interactive calculator for aviation navigation and flight planning mathematics.

## Features
- Implements formulas from the Aviation Navigation Specification.
- Visualizes wind triangles, plane rotations, track courses, and wind vectors.
- Adaptive web interface designed to run on Termux (Android) and inside a web container.
- Powered by Python (FastAPI) and p5.js.

## Getting Started (Termux)
Run the setup script to install dependencies and start the server:
```bash
bash scripts/termux-setup.sh
```

## Getting Started (Docker)
Run via Docker Compose:
```bash
docker-compose up --build
```

Then visit `http://localhost:8000` in your web browser.
