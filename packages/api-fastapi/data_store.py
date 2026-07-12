import datetime
import random
import pandas as pd
from typing import List, Dict, Any

# Define the floats, buoys, and stations
STATIONS_METADATA = [
    {
        "id": "5906831",
        "name": "ARGO Float 5906831",
        "type": "float",
        "lat": 13.0827,
        "lng": 80.2707,  # Near Chennai, India
        "region": "India - Chennai",
        "description": "Active drifting profiling float monitoring the Bay of Bengal near Chennai."
    },
    {
        "id": "5906832",
        "name": "ARGO Float 5906832",
        "type": "float",
        "lat": 8.1256,
        "lng": 73.0125,  # Near Lakshadweep, India
        "region": "India - Lakshadweep",
        "description": "Drifting float capturing Lakshadweep sea surface and deep profile data."
    },
    {
        "id": "5906833",
        "name": "ARGO Float 5906833",
        "type": "float",
        "lat": 15.4989,
        "lng": 73.8278,  # Near Goa / Arabian Sea, India
        "region": "India - Goa",
        "description": "Arabian Sea profiling float reporting salinity anomalies."
    },
    {
        "id": "5906834",
        "name": "ARGO Float 5906834",
        "type": "float",
        "lat": -33.8688,
        "lng": 151.2093,  # Near Sydney, Australia
        "region": "Australia - Tasman Sea",
        "description": "Profiling float monitoring the East Australian Current and Tasman Sea."
    },
    {
        "id": "5906835",
        "name": "ARGO Float 5906835",
        "type": "float",
        "lat": -18.2871,
        "lng": 147.6992,  # Great Barrier Reef, Australia
        "region": "Australia - Coral Sea",
        "description": "Coral Sea float tracking thermal stress near the Great Barrier Reef."
    },
    {
        "id": "5906836",
        "name": "Ocean Buoy OB-402",
        "type": "buoy",
        "lat": 10.0,
        "lng": 76.0,  # Laccadive Sea
        "region": "India - Laccadive Sea",
        "description": "Fixed moored oceanographic buoy recording meteorological and surface variables."
    },
    {
        "id": "5906837",
        "name": "Monitoring Station MS-01",
        "type": "station",
        "lat": -25.2744,
        "lng": 133.7751,  # Australia Central Coast (Simulated marine park)
        "region": "Australia - Coastal",
        "description": "Coastal research observation station measuring oxygen levels and nutrient load."
    }
]

def generate_historical_data() -> Dict[str, List[Dict[str, Any]]]:
    """Generates 30 days of historical data up to today (2026-07-11) for all floats."""
    end_date = datetime.date(2026, 7, 11)
    date_list = [end_date - datetime.timedelta(days=x) for x in range(30)]
    date_list.reverse() # chronologically ordered
    
    data = {}
    
    # Consistent seeds for reproducibility
    random.seed(42)
    
    for meta in STATIONS_METADATA:
        float_id = meta["id"]
        float_type = meta["type"]
        region = meta["region"]
        
        # Determine base variables based on location/type
        if "India" in region:
            base_temp = 28.5 if "Chennai" in region else 27.8
            base_salinity = 33.5 if "Chennai" in region else 35.2  # Chennai has lower salinity due to river runoff
            base_chlorophyll = 0.55 if "Chennai" in region else 0.35
            base_oxygen = 4.8
        else:
            base_temp = 19.5 if "Tasman" in region else 24.2
            base_salinity = 35.8
            base_chlorophyll = 0.25
            base_oxygen = 5.6
            
        float_data = []
        for i, dt in enumerate(date_list):
            dt_str = dt.isoformat()
            # Add some trend and minor random fluctuations
            temp_trend = 0.5 * (i / 30.0) # slightly warming
            sal_trend = -0.2 * (i / 30.0) if "Chennai" in region else 0.1 * (i / 30.0)
            
            temp = round(base_temp + temp_trend + random.uniform(-0.4, 0.4), 2)
            sal = round(base_salinity + sal_trend + random.uniform(-0.15, 0.15), 2)
            press = round(10.0 + random.uniform(-1.0, 1.0) + (0 if float_type != "float" else random.randint(0, 3) * 150), 1)
            depth = round(press * 0.99, 1) # simple depth conversion
            chlor = round(max(0.01, base_chlorophyll + random.uniform(-0.08, 0.08)), 2)
            ox = round(max(1.0, base_oxygen + random.uniform(-0.3, 0.3)), 2)
            wind = round(4.5 + random.uniform(-2.5, 5.0), 1)
            wave = round(0.5 + wind * 0.2 + random.uniform(-0.3, 0.3), 2)
            
            float_data.append({
                "date": dt_str,
                "timestamp": f"{dt_str}T12:00:00Z",
                "temperature": temp,
                "salinity": sal,
                "pressure": press,
                "depth": depth,
                "chlorophyll": chlor,
                "oxygen": ox,
                "windSpeed": wind,
                "waveHeight": max(0.1, wave)
            })
            
        data[float_id] = float_data
        
    return data

# Load dataset once at import
RAW_DATA = generate_historical_data()

def get_latest_data() -> List[Dict[str, Any]]:
    """Returns the latest day's observation (2026-07-11) for all stations."""
    latest_list = []
    for meta in STATIONS_METADATA:
        fid = meta["id"]
        latest_obs = RAW_DATA[fid][-1]
        latest_list.append({
            **meta,
            **latest_obs
        })
    return latest_list

def get_float_history(float_id: str) -> List[Dict[str, Any]]:
    """Returns the 30-day historical time-series for a single float."""
    meta = next((m for m in STATIONS_METADATA if m["id"] == float_id), None)
    if not meta:
        return []
    history = RAW_DATA.get(float_id, [])
    return [{**meta, **obs} for obs in history]

def get_aggregated_trends() -> List[Dict[str, Any]]:
    """Aggregates all floats to calculate averages per day for charts."""
    trends = []
    end_date = datetime.date(2026, 7, 11)
    date_list = [end_date - datetime.timedelta(days=x) for x in range(30)]
    date_list.reverse()
    
    for idx, dt in enumerate(date_list):
        dt_str = dt.isoformat()
        day_temps = []
        day_sals = []
        day_press = []
        day_ox = []
        day_chlor = []
        
        for fid in RAW_DATA:
            obs = RAW_DATA[fid][idx]
            day_temps.append(obs["temperature"])
            day_sals.append(obs["salinity"])
            day_press.append(obs["pressure"])
            day_ox.append(obs["oxygen"])
            day_chlor.append(obs["chlorophyll"])
            
        trends.append({
            "date": dt_str[-5:], # MM-DD format
            "temperature": round(sum(day_temps) / len(day_temps), 2),
            "salinity": round(sum(day_sals) / len(day_sals), 2),
            "pressure": round(sum(day_press) / len(day_press), 2),
            "oxygen": round(sum(day_ox) / len(day_ox), 2),
            "chlorophyll": round(sum(day_chlor) / len(day_chlor), 2),
            "floatCount": len(STATIONS_METADATA)
        })
    return trends
