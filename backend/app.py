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
    tc_rad = math.radians(req.true_course)
    wd_rad = math.radians(req.wind_direction)
    wind_angle = wd_rad - tc_rad
    wind_angle_deg = math.degrees(wind_angle)
    
    crosswind = req.wind_speed * math.sin(wind_angle)
    headwind = req.wind_speed * math.cos(wind_angle)
    
    wca_rad = math.asin(crosswind / req.true_airspeed)
    wca_deg = math.degrees(wca_rad)
    
    true_heading = (req.true_course + wca_deg) % 360
    ground_speed = req.true_airspeed * math.cos(wca_rad) - headwind

    formulas = [
        {
            "symbolic": "Wind Angle (WA) = Wind Direction (WD) - True Course (TC)",
            "plugged": f"WA = {req.wind_direction}° - {req.true_course}° = {wind_angle_deg:.1f}°"
        },
        {
            "symbolic": "Crosswind (XW) = Wind Speed (WS) * sin(WA)",
            "plugged": f"XW = {req.wind_speed} * sin({wind_angle_deg:.1f}°) = {crosswind:.2f} kts"
        },
        {
            "symbolic": "Headwind (HW) = Wind Speed (WS) * cos(WA)",
            "plugged": f"HW = {req.wind_speed} * cos({wind_angle_deg:.1f}°) = {headwind:.2f} kts"
        },
        {
            "symbolic": "Wind Correction Angle (WCA) = arcsin(XW / True Airspeed (TAS))",
            "plugged": f"WCA = arcsin({crosswind:.2f} / {req.true_airspeed}) = {wca_deg:.2f}°"
        },
        {
            "symbolic": "True Heading (TH) = True Course (TC) + WCA",
            "plugged": f"TH = {req.true_course}° + ({wca_deg:.2f}°) = {true_heading:.2f}°"
        },
        {
            "symbolic": "Ground Speed (GS) = TAS * cos(WCA) - HW",
            "plugged": f"GS = {req.true_airspeed} * cos({wca_deg:.2f}°) - ({headwind:.2f}) = {ground_speed:.2f} kts"
        }
    ]

    return {
        "true_heading": true_heading,
        "ground_speed": ground_speed,
        "wind_correction_angle": wca_deg,
        "formulas": formulas
    }

class CompassRequest(BaseModel):
    true_heading: float
    variation: float # Positive for West, Negative for East (or vice versa, let's just ask for numeric and sign)
    deviation: float # Positive for West, Negative for East

@app.post("/api/calculate/compass")
async def calculate_compass(req: CompassRequest):
    magnetic_heading = (req.true_heading + req.variation) % 360
    compass_heading = (magnetic_heading + req.deviation) % 360
    
    formulas = [
        {
            "symbolic": "Magnetic Heading (MH) = True Heading (TH) + Variation (VAR)",
            "plugged": f"MH = {req.true_heading}° + ({req.variation}°) = {magnetic_heading:.2f}°"
        },
        {
            "symbolic": "Compass Heading (CH) = Magnetic Heading (MH) + Deviation (DEV)",
            "plugged": f"CH = {magnetic_heading:.2f}° + ({req.deviation}°) = {compass_heading:.2f}°"
        }
    ]
    
    return {
        "true_heading": req.true_heading,
        "magnetic_heading": magnetic_heading,
        "compass_heading": compass_heading,
        "formulas": formulas
    }

class CoordinateRequest(BaseModel):
    lat1: float
    lon1: float
    lat2: float
    lon2: float

@app.post("/api/calculate/distance")
async def calculate_distance(req: CoordinateRequest):
    R = 3440.065 # Earth radius in NM
    lat1, lon1, lat2, lon2 = map(math.radians, [req.lat1, req.lon1, req.lat2, req.lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    distance = R * c
    
    y = math.sin(dlon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    bearing = (math.degrees(math.atan2(y, x)) + 360) % 360
    
    formulas = [
        {
            "symbolic": "a = sin²(Δlat/2) + cos(lat1)*cos(lat2)*sin²(Δlon/2)",
            "plugged": f"a = sin²({dlat:.4f}/2) + cos({lat1:.4f})*cos({lat2:.4f})*sin²({dlon:.4f}/2) = {a:.6f}"
        },
        {
            "symbolic": "Distance = R * 2 * arcsin(√a)   [R = 3440.065 NM]",
            "plugged": f"Distance = 3440.065 * 2 * arcsin(√{a:.6f}) = {distance:.2f} NM"
        },
        {
            "symbolic": "Track = atan2( sin(Δlon)*cos(lat2), cos(lat1)*sin(lat2) - sin(lat1)*cos(lat2)*cos(Δlon) )",
            "plugged": f"Track = atan2({y:.4f}, {x:.4f}) = {bearing:.2f}°"
        }
    ]
    
    return {
        "distance_nm": distance,
        "true_track": bearing,
        "formulas": formulas
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
    formulas = []
    
    if dist is None and spd is not None and time is not None:
        dist = spd * (time / 60)
        formulas.append({
            "symbolic": "Distance (D) = Speed (S) * (Time (T) / 60)",
            "plugged": f"D = {spd} * ({time} / 60) = {dist:.2f} NM"
        })
    elif spd is None and dist is not None and time is not None:
        spd = dist / (time / 60) if time > 0 else 0
        formulas.append({
            "symbolic": "Speed (S) = Distance (D) / (Time (T) / 60)",
            "plugged": f"S = {dist} / ({time} / 60) = {spd:.2f} kts"
        })
    elif time is None and dist is not None and spd is not None:
        time = (dist / spd) * 60 if spd > 0 else 0
        formulas.append({
            "symbolic": "Time (T) = (Distance (D) / Speed (S)) * 60",
            "plugged": f"T = ({dist} / {spd}) * 60 = {time:.2f} minutes"
        })
        
    return {
        "distance": dist or 0.0,
        "speed": spd or 0.0,
        "time_min": time or 0.0,
        "formulas": formulas
    }

class AtmosphereRequest(BaseModel):
    indicated_altitude: float
    oat: float # outside air temp in Celsius

@app.post("/api/calculate/altitude")
async def calculate_altitude(req: AtmosphereRequest):
    isa_temp = 15.0 - (1.98 * (req.indicated_altitude / 1000.0))
    isa_dev = req.oat - isa_temp
    true_altitude = req.indicated_altitude + (req.indicated_altitude * 0.004 * isa_dev)
    
    formulas = [
        {
            "symbolic": "ISA Temp = 15 - 1.98 * (Indicated Alt / 1000)",
            "plugged": f"ISA Temp = 15 - 1.98 * ({req.indicated_altitude} / 1000) = {isa_temp:.2f} °C"
        },
        {
            "symbolic": "ISA Deviation = OAT - ISA Temp",
            "plugged": f"ISA Dev = {req.oat} - ({isa_temp:.2f}) = {isa_dev:.2f} °C"
        },
        {
            "symbolic": "True Alt = Indicated Alt + (Indicated Alt * 0.004 * ISA Dev)",
            "plugged": f"True Alt = {req.indicated_altitude} + ({req.indicated_altitude} * 0.004 * {isa_dev:.2f}) = {true_altitude:.2f} ft"
        }
    ]
    
    return {
        "isa_temp": isa_temp,
        "isa_deviation": isa_dev,
        "true_altitude": true_altitude,
        "formulas": formulas
    }

class RadarRequest(BaseModel):
    distance_nm: float

@app.post("/api/calculate/radar")
async def calculate_radar(req: RadarRequest):
    time_us = req.distance_nm * 12.36
    
    formulas = [
        {
            "symbolic": "Round Trip Time (µs) = Target Distance (NM) * 12.36",
            "plugged": f"Time = {req.distance_nm} * 12.36 = {time_us:.2f} µs"
        }
    ]
    
    return {
        "round_trip_time_us": time_us,
        "formulas": formulas
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
