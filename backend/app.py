from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import math

import os

app = FastAPI(title="Aero-Nav Interactive Calculator")

# Determine base path for serving files reliably
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# Serve frontend files
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
async def root():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# Example calculation endpoint
class WindTriangleRequest(BaseModel):
    true_course: float
    true_airspeed: float
    wind_direction: float
    wind_speed: float

@app.post("/api/calculate/wind-triangle")
async def calculate_wind_triangle(req: WindTriangleRequest):
    # Convert to radians for math functions
    tc_rad = math.radians(req.true_course)
    wd_rad = math.radians(req.wind_direction)
    
    # Wind angle relative to course
    # (Wind direction is where it's coming FROM)
    # If wind is from 090 and course is 090, headwind = max
    wind_angle = wd_rad - tc_rad
    
    # Components
    crosswind = req.wind_speed * math.sin(wind_angle)
    headwind = req.wind_speed * math.cos(wind_angle)
    
    # Wind Correction Angle (WCA)
    # sin(WCA) = crosswind / TAS
    wca_rad = math.asin(crosswind / req.true_airspeed)
    wca_deg = math.degrees(wca_rad)
    
    # True Heading
    true_heading = (req.true_course + wca_deg) % 360
    
    # Ground speed
    # GS = TAS * cos(WCA) - Headwind
    ground_speed = req.true_airspeed * math.cos(wca_rad) - headwind

    return {
        "true_heading": true_heading,
        "ground_speed": ground_speed,
        "wind_correction_angle": wca_deg
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
