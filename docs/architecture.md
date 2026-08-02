# Project Architecture Decisions

## Core Stack
- **Backend**: FastAPI (Python) - Lightweight, fast, easy to serve static files and handle math heavy APIs.
- **Frontend**: HTML/JS/CSS with p5.js - p5.js chosen specifically for its strengths in playful, canvas-based visual animations (rotating planes, map plotting, vectors).
- **Environment**: Docker & Termux scripts - ensures it runs smoothly as a webserver in a Termux environment, and containerized for desktop browsers.

## Communication Pattern (The Paper-Trail)
- All feature requests, bugs, and tasks are tracked via markdown files in the `ISSUES/` folder.
- When acting on an issue, update its `Status` directly in the file to establish a trail of progress.
