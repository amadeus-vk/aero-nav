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

class CompassRequest(BaseModel):
    true_heading: float
    variation: float # Positive for West, Negative for East (or vice versa, let's just ask for numeric and sign)
    deviation: float # Positive for West, Negative for East

@app.post("/api/calculate/compass")
async def calculate_compass(req: CompassRequest):
    magnetic_heading = (req.true_heading + req.variation) % 360
    compass_heading = (magnetic_heading + req.deviation) % 360
    return {
        "true_heading": req.true_heading,
        "magnetic_heading": magnetic_heading,
        "compass_heading": compass_heading
    }

class CoordinateRequest(BaseModel):
    lat1: float
    lon1: float
    lat2: float
    lon2: float

@app.post("/api/calculate/distance")
async def calculate_distance(req: CoordinateRequest):
    # Haversine formula
    R = 3440.065 # Earth radius in NM
    lat1, lon1, lat2, lon2 = map(math.radians, [req.lat1, req.lon1, req.lat2, req.lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    distance = R * c
    
    # Initial bearing
    y = math.sin(dlon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    bearing = (math.degrees(math.atan2(y, x)) + 360) % 360
    
    return {
        "distance_nm": distance,
        "true_track": bearing
    }

class TSDRequest(BaseModel):
    distance: float = None
    speed: float = None
    time_min: float = None

@app.post("/api/calculate/tsd")
async def calculate_tsd(req: TSDRequest):
    dist = req.distance
    spd = req.speed
    time = req.time_min
    
    if dist is None and spd is not None and time is not None:
        dist = spd * (time / 60)
    elif spd is None and dist is not None and time is not None:
        spd = dist / (time / 60) if time > 0 else 0
    elif time is None and dist is not None and spd is not None:
        time = (dist / spd) * 60 if spd > 0 else 0
        
    return {
        "distance": dist or 0.0,
        "speed": spd or 0.0,
        "time_min": time or 0.0
    }

class AtmosphereRequest(BaseModel):
    indicated_altitude: float
    oat: float # outside air temp in Celsius

@app.post("/api/calculate/altitude")
async def calculate_altitude(req: AtmosphereRequest):
    # ISA temp at altitude
    isa_temp = 15.0 - (1.98 * (req.indicated_altitude / 1000.0))
    isa_dev = req.oat - isa_temp
    # 4% per 10C deviation rule of thumb for True Altitude
    true_altitude = req.indicated_altitude + (req.indicated_altitude * 0.004 * isa_dev)
    
    return {
        "isa_temp": isa_temp,
        "isa_deviation": isa_dev,
        "true_altitude": true_altitude
    }

class RadarRequest(BaseModel):
    distance_nm: float

@app.post("/api/calculate/radar")
async def calculate_radar(req: RadarRequest):
    # 1 NM = 12.36 microseconds round trip
    time_us = req.distance_nm * 12.36
    return {
        "round_trip_time_us": time_us
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
