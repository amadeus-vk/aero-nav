#!/data/data/com.termux/files/usr/bin/bash
# Termux setup script for Aero-Nav Calculator
pkg update -y
pkg install -y python
pip install -r backend/requirements.txt
echo "Setup complete! Run 'python backend/app.py' or 'uvicorn backend.app:app --host 0.0.0.0 --port 8000' to start the server."
