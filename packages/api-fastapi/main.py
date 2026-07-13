import os
import json
import asyncio
import random
import re
import openai
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import data_store

load_dotenv()

# Initialize OpenAI client if key is present
openai_api_key = os.environ.get("OPENAI_API_KEY")
gemini_api_key = os.environ.get("GEMINI_API_KEY")
gemini_model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

client = None
model_name = "gpt-4o-mini"

if gemini_api_key:
    # Use Gemini's OpenAI-compatible endpoint
    client = openai.OpenAI(
        api_key=gemini_api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )
    model_name = gemini_model
elif openai_api_key:
    # Use OpenAI API
    client = openai.OpenAI(
        api_key=openai_api_key
    )
    model_name = "gpt-4o-mini"

app = FastAPI(title="FloatChat AI Backend", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    conversation_id: str

# Keep conversation memory in-memory
CONVERSATIONS = {}

def get_system_prompt() -> str:
    latest_data = data_store.get_latest_data()
    sensor_summaries = []
    for item in latest_data:
        sensor_summaries.append(
            f"- **{item['name']}** ({item['type']}) ID `{item['id']}` in **{item['region']}**: "
            f"Coordinates: [{item['lat']}, {item['lng']}]. "
            f"Latest metrics: Temperature {item['temperature']} °C, Salinity {item['salinity']} PSU, Pressure {item['pressure']} dbar, "
            f"Depth {item['depth']} m, Chlorophyll {item['chlorophyll']} mg/m³, Oxygen {item['oxygen']} mL/L, "
            f"Wind Speed {item['windSpeed']} m/s, Wave Height {item['waveHeight']} m. "
            f"Description: {item['description']}"
        )
    sensors_text = "\n".join(sensor_summaries)
    
    prompt = f"""You are FloatChat AI, an intelligent, context-aware ocean data assistant.
You help users explore and analyze oceanographic conditions, ARGO floats, climate trends, forecasts, and marine research.

Active Sensors Network Data (latest observations as of July 11, 2026):
{sensors_text}

You MUST follow these rules when generating responses:
1. Speak naturally and conversationally, like ChatGPT. Ask follow-up questions if needed.
2. Use markdown for structures, headers, lists, code blocks, tables, or bold formatting.
3. If data is unavailable, clearly state that instead of inventing values. Do not invent arbitrary coordinates or sensor values.
4. At the very end of your response, you MUST append a line containing exactly `[UI_INTENT]` followed by a valid JSON block indicating what UI components to show.
5. In the JSON block, you can optionally include a list of custom follow-up questions under `suggested_questions` (2-3 items) that are highly relevant to the current conversation context.

JSON Format:
[UI_INTENT]
{{
  "query_type": "summary" | "floats_near_region" | "temp" | "salinity" | "chlorophyll" | "oxygen" | "find_float" | "compare" | "forecast" | "downloads_only" | "general",
  "region_filter": "India" | "Australia" | "all" | null,
  "float_id_filter": "<id>" | null,
  "comparison_regions": ["<r1>", "<r2>"] | null,
  "confidence_level": "<string>" | null,
  "suggested_questions": ["<question_1>", "<question_2>"] | null
}}

Response components guide:
- "summary": if user asks for summaries, reports, or general ocean health (e.g. "Today's ocean summary"). (Shows all widgets).
- "floats_near_region": if user asks about floats near a region (e.g., India, Australia). (Shows map only).
- "temp": if user asks about temperatures. (Shows map and temp charts).
- "salinity": if user asks about salinity. (Shows map and salinity charts).
- "chlorophyll": if user asks about chlorophyll/phytoplankton. (Shows map and chlorophyll charts).
- "oxygen": if user asks about dissolved oxygen. (Shows map and oxygen charts).
- "find_float": if user asks "Where is Float <id>?" or similar. (Shows map zoomed to it and details table).
- "compare": if user asks to compare regions (e.g., India vs Australia). (Shows comparison table and charts).
- "forecast": if user asks for forecasts/predictions. (Shows forecast trend charts).
- "downloads_only": if user asks to download data, CSV, or PDFs. (Shows downloads panel only).
- "general": if user asks educational or generic questions (e.g. "What is salinity?", "Hello") without requesting dashboards/maps/graphs. (Shows text only).
"""
    return prompt

def build_structured_data(intent: dict) -> dict:
    query_type = intent.get("query_type", "general")
    region_filter = intent.get("region_filter")
    float_id_filter = intent.get("float_id_filter")
    
    active_components = {
        "cards": False,
        "map": False,
        "charts": False,
        "table": False,
        "downloads": False,
        "comparisonTable": False
    }
    
    meta = {
        "zoom": 2,
        "center": [0.0, 110.0],
        "chartMetric": "all",
        "confidenceLevel": intent.get("confidence_level")
    }

    latest_obs = data_store.get_latest_data()
    
    if query_type == "summary":
        active_components = {
            "cards": True, "map": True, "charts": True, "table": True, "downloads": True, "comparisonTable": False
        }
        meta["chartMetric"] = "all"
    elif query_type == "floats_near_region":
        active_components["map"] = True
        if region_filter == "India":
            meta["zoom"] = 5
            meta["center"] = [12.0, 78.0]
        elif region_filter == "Australia":
            meta["zoom"] = 4
            meta["center"] = [-26.0, 140.0]
    elif query_type == "find_float":
        active_components["map"] = True
        active_components["table"] = True
        if float_id_filter:
            target_float = next((o for o in latest_obs if o["id"] == float_id_filter), None)
            if target_float:
                meta["zoom"] = 8
                meta["center"] = [target_float["lat"], target_float["lng"]]
    elif query_type in ["temp", "salinity", "chlorophyll", "oxygen"]:
        active_components["map"] = True
        active_components["charts"] = True
        meta["chartMetric"] = "temperature" if query_type == "temp" else query_type
    elif query_type == "compare":
        active_components["charts"] = True
        active_components["comparisonTable"] = True
        meta["chartMetric"] = "all"
    elif query_type == "forecast":
        active_components["charts"] = True
        meta["chartMetric"] = "all"
    elif query_type == "downloads_only":
        active_components["downloads"] = True
    elif query_type == "general":
        pass
 
    filtered_obs = latest_obs
    if region_filter and region_filter != "all":
        filtered_obs = [o for o in filtered_obs if region_filter.lower() in o["region"].lower()]
    if float_id_filter:
        filtered_obs = [o for o in filtered_obs if o["id"] == float_id_filter]

    cards = {}
    if active_components["cards"] and len(filtered_obs) > 0:
        avg_temp = round(sum(o["temperature"] for o in filtered_obs) / len(filtered_obs), 2)
        avg_sal = round(sum(o["salinity"] for o in filtered_obs) / len(filtered_obs), 2)
        avg_chlor = round(sum(o["chlorophyll"] for o in filtered_obs) / len(filtered_obs), 2)
        avg_ox = round(sum(o["oxygen"] for o in filtered_obs) / len(filtered_obs), 2)
        avg_wave = round(sum(o["waveHeight"] for o in filtered_obs) / len(filtered_obs), 2)
        avg_wind = round(sum(o["windSpeed"] for o in filtered_obs) / len(filtered_obs), 2)
        avg_press = round(sum(o["pressure"] for o in filtered_obs) / len(filtered_obs), 1)
        
        health_score = 85
        if avg_temp > 28.0:
            health_score -= int((avg_temp - 28.0) * 10)
        health_score = max(40, min(98, health_score))
        
        cards = {
            "oceanHealthScore": health_score,
            "activeFloats": len(filtered_obs),
            "temperature": f"{avg_temp} °C",
            "salinity": f"{avg_sal} PSU",
            "chlorophyll": f"{avg_chlor} mg/m³",
            "oxygen": f"{avg_ox} mL/L",
            "waveHeight": f"{avg_wave} m",
            "windSpeed": f"{avg_wind} m/s",
            "pressure": f"{avg_press} hPa"
        }

    map_data = []
    if active_components["map"]:
        for o in filtered_obs:
            map_data.append({
                "id": o["id"],
                "name": o["name"],
                "type": o["type"],
                "lat": o["lat"],
                "lng": o["lng"],
                "temperature": o["temperature"],
                "salinity": o["salinity"],
                "pressure": o["pressure"],
                "depth": o["depth"],
                "chlorophyll": o["chlorophyll"],
                "oxygen": o["oxygen"],
                "timestamp": o["timestamp"]
            })

    chart_data = []
    if active_components["charts"]:
        if float_id_filter:
            history = data_store.get_float_history(float_id_filter)
            for h in history:
                chart_data.append({
                    "date": h["date"][-5:],
                    "temperature": h["temperature"],
                    "salinity": h["salinity"],
                    "pressure": h["pressure"],
                    "oxygen": h["oxygen"],
                    "chlorophyll": h["chlorophyll"],
                    "floatCount": 1
                })
        else:
            chart_data = data_store.get_aggregated_trends()

    table_data = []
    if active_components["table"]:
        if query_type == "find_float" and float_id_filter:
            history = data_store.get_float_history(float_id_filter)
            for h in history:
                table_data.append({
                    "floatId": h["id"],
                    "latitude": h["lat"],
                    "longitude": h["lng"],
                    "temperature": h["temperature"],
                    "salinity": h["salinity"],
                    "pressure": h["pressure"],
                    "depth": h["depth"],
                    "chlorophyll": h["chlorophyll"],
                    "oxygen": h["oxygen"],
                    "date": h["date"]
                })
        else:
            for o in filtered_obs:
                table_data.append({
                    "floatId": o["id"],
                    "latitude": o["lat"],
                    "longitude": o["lng"],
                    "temperature": o["temperature"],
                    "salinity": o["salinity"],
                    "pressure": o["pressure"],
                    "depth": o["depth"],
                    "chlorophyll": o["chlorophyll"],
                    "oxygen": o["oxygen"],
                    "date": o["date"]
                })

    comparison_data = {}
    if active_components["comparisonTable"]:
        comparison_data = {
            "headers": ["Metric", "India Average", "Australia Average", "Difference"],
            "rows": [
                ["Temperature (°C)", "28.18 °C", "22.86 °C", "+5.32 °C (India warmer)"],
                ["Salinity (PSU)", "34.58 PSU", "35.85 PSU", "-1.27 PSU (Australia saltier)"],
                ["Chlorophyll", "0.48 mg/m³", "0.24 mg/m³", "+0.24 mg/m³ (India higher)"],
                ["Oxygen (mL/L)", "4.87 mL/L", "5.62 mL/L", "-0.75 mL/L (Australia higher)"]
            ]
        }

    return {
        "activeComponents": active_components,
        "cards": cards,
        "mapData": map_data,
        "chartData": chart_data,
        "tableData": table_data,
        "downloads": {"csv_available": True} if active_components["downloads"] else {},
        "comparisonData": comparison_data,
        "meta": meta
    }

@app.get("/")
def process_chat_query(user_message: str) -> tuple[str, dict]:
    msg = user_message.strip().lower()
    latest_data = data_store.get_latest_data()
    
    # helper statistics
    total_floats = len(latest_data)
    avg_temp = round(sum(o["temperature"] for o in latest_data) / total_floats, 2)
    avg_sal = round(sum(o["salinity"] for o in latest_data) / total_floats, 2)
    avg_press = round(sum(o["pressure"] for o in latest_data) / total_floats, 1)
    avg_chlor = round(sum(o["chlorophyll"] for o in latest_data) / total_floats, 2)
    avg_ox = round(sum(o["oxygen"] for o in latest_data) / total_floats, 2)
    avg_wave = round(sum(o["waveHeight"] for o in latest_data) / total_floats, 2)
    avg_wind = round(sum(o["windSpeed"] for o in latest_data) / total_floats, 2)

    # 1. Summary
    if any(k in msg for k in ["today's ocean summary", "today's ocean", "ocean health", "today's data", "show today's report", "generate today's report", "show ocean conditions"]):
        intros = [
            "# 🌊 AI Ocean Summary\n\nLatest global telemetry report analyzed. Dynamic observations indicate stable oceanic patterns with mild regional variances.",
            "# 🌊 AI Ocean Summary\n\nGlobal ARGO profiling float array monitoring overview. Real-time telemetry digest indicates general marine system health within standard deviation limits.",
            "# 🌊 AI Ocean Summary\n\nExecutive oceanography intelligence report compiled. Observations represent active deep-sea monitoring metrics."
        ]
        intro = random.choice(intros)
        
        events = [
            "- **Thermal Profile**: Normal range, with slight thermal stress detected near the Coral Sea (GBR boundary).",
            "- **Salinity Runoff**: Standard salinity levels. A freshwater lens signature is detected near Chennai, India due to seasonal river discharge.",
            "- **Oxygenation**: Adequate dissolved oxygen levels globally. Moored stations register optimal values supporting marine biodiversity."
        ]
        random.shuffle(events)
        events_text = "\n".join(events)
        
        recs = [
            "Monitor Coral Sea float profiles for thermal threshold breaches.",
            "Analyze time-series salinity levels near Laccadive and Tasman basins.",
            "Verify deep-water oxygen sensor calibrations for Chennai drifting buoys."
        ]
        rec = random.choice(recs)
        
        text = f"""{intro}

### Professional Executive Summary
Global ocean health is currently rated at **85/100 (Optimal)** based on telemetry from active ARGO floats, moored buoys, and coastal observation networks.

### Overall Ocean Health Parameters
- **Active Floats**: {total_floats} monitoring stations online.
- **Sea Surface Temperature**: Average {avg_temp} °C globally.
- **Salinity**: Average {avg_sal} PSU.
- **Pressure**: Average {avg_press} dbar.
- **Chlorophyll**: Average {avg_chlor} mg/m³.
- **Dissolved Oxygen**: Average {avg_ox} mL/L.

### Meteorological & Wave Conditions
- **Wind Speed**: Average {avg_wind} m/s.
- **Wave Height**: Average {avg_wave} m.

### Significant Environmental Events
{events_text}

### AI Ocean Analyst Recommendation
- *Primary Action*: {rec}
- *Secondary Action*: Expand drifting float distribution to capture deep-sea thermal anomalies.
"""
        intent = {
            "query_type": "summary",
            "region_filter": "all",
            "float_id_filter": None,
            "comparison_regions": None,
            "confidence_level": "High (94%)",
            "suggested_questions": ["Show floats near India", "Forecast", "Explain Salinity"]
        }
        return text, intent

    # 2. Find Float
    float_match = re.search(r"\b590683[1-7]\b", msg)
    if float_match or "where is float" in msg:
        float_id = float_match.group(0) if float_match else "5906831"
        target = next((o for o in latest_data if o["id"] == float_id), None)
        if target:
            pos_desc = f"located in **{target['region']}** at coordinates [{target['lat']}, {target['lng']}]."
            text = f"""# 🛰️ Float Information & Observations: ID {float_id}

Float **{target['name']}** ({target['type']}) is active and currently {pos_desc}

### Latest Position & Telemetry (July 11, 2026)
- **Latitude**: {target['lat']}
- **Longitude**: {target['lng']}
- **Timestamp**: {target['timestamp']}
- **Depth**: {target['depth']} m (mooring pressure {target['pressure']} dbar)

### Telemetric Logs
- **Temperature**: {target['temperature']} °C
- **Salinity**: {target['salinity']} PSU
- **Oxygen**: {target['oxygen']} mL/L
- **Chlorophyll**: {target['chlorophyll']} mg/m³

### Nearby Floats
- Neighboring floats detected: {[f['id'] for f in latest_data if f['id'] != float_id][:3]}

### AI Analyst Observations
- Float {float_id} indicates stable chemical metrics. Vertical profile data demonstrates a clear thermocline at standard depths for this region. No anomalous spikes detected.
"""
            intent = {
                "query_type": "find_float",
                "region_filter": None,
                "float_id_filter": float_id,
                "comparison_regions": None,
                "confidence_level": "99%",
                "suggested_questions": ["Explain Pressure", "Forecast", "Today's Summary"]
            }
            return text, intent
        else:
            text = f"Float ID not recognized. Available Float IDs in our network: {', '.join([o['id'] for o in latest_data])}."
            return text, {"query_type": "general"}

    # 3. Show floats near India/Chennai/Australia/Pacific
    if any(k in msg for k in ["floats near india", "floats near chennai", "floats near australia", "floats near pacific"]):
        region = "India" if any(k in msg for k in ["india", "chennai"]) else "Australia"
        regional_floats = [o for o in latest_data if region.lower() in o["region"].lower() or (region == "India" and "laccadive" in o["region"].lower())]
        
        count = len(regional_floats)
        reg_temp = round(sum(o["temperature"] for o in regional_floats) / count, 2) if count > 0 else 25.0
        reg_sal = round(sum(o["salinity"] for o in regional_floats) / count, 2) if count > 0 else 34.5
        
        text = f"""# 🗺️ Interactive Map: Floats near {region}

The platform has located **{count} active sensors** in the **{region}** ocean region.

### Quick Regional Statistics
- **Total Sensors**: {count} online
- **Average Temperature**: {reg_temp} °C
- **Average Salinity**: {reg_sal} PSU

### Recent Observations & Analysis
- Observations indicate regular regional current flow patterns. 
- In the {region} basin, sensors register high-fidelity marine metrics. Chlorophyll density is consistent with summer biological cycle trends.
"""
        intent = {
            "query_type": "floats_near_region",
            "region_filter": region,
            "float_id_filter": None,
            "comparison_regions": None,
            "confidence_level": "High",
            "suggested_questions": ["Compare India vs Australia", "Explain Chlorophyll", "Download CSV"]
        }
        return text, intent

    # 4. Compare
    if "compare" in msg or "vs" in msg or "versus" in msg:
        r1, r2 = "India", "Australia"
        if "arabian" in msg or "bay of bengal" in msg:
            r1, r2 = "Arabian Sea", "Bay of Bengal"
            
        text = f"""# 📊 Regional Comparison: {r1} vs {r2}

Here is the comparative intelligence summary between the **{r1}** and **{r2}** basins.

### Comparison Metrics
- **Thermal Profiles**: {r1} presents generally warmer surface waters compared to the cooler {r2} baseline.
- **Salinity Concentration**: Evaporative rates and river runoff ratios result in distinct salinity profiles in both domains.

### Differential Averages
| Metric | {r1} average | {r2} average | Difference |
| :--- | :--- | :--- | :--- |
| Temperature | 28.18 °C | 22.86 °C | +5.32 °C ({r1} warmer) |
| Salinity | 34.58 PSU | 35.85 PSU | -1.27 PSU ({r2} saltier) |
| Chlorophyll | 0.48 mg/m³ | 0.24 mg/m³ | +0.24 mg/m³ |
| Oxygen | 4.87 mL/L | 5.62 mL/L | -0.75 mL/L |

### AI Analysis & Key Differences
- **Evaporative Delta**: Lower salinity in {r1} sectors can be attributed to higher river discharges and precipitation runoff.
- **Chlorophyll Density**: Higher nutrient levels support a more active phytoplankton network in {r1}.

### Recommendations
1. Deploy additional wave period sensors in {r2} coastal boundaries.
2. Conduct seasonal nutrient profiling in the {r1} delta zone.
"""
        intent = {
            "query_type": "compare",
            "region_filter": None,
            "float_id_filter": None,
            "comparison_regions": [r1, r2],
            "confidence_level": "95%",
            "suggested_questions": ["Show floats near India", "Forecast", "Download CSV"]
        }
        return text, intent

    # 5. Rankings
    if any(k in msg for k in ["highest", "lowest", "warmest", "deepest", "top", "rank", "ranking"]):
        metric_name = "temperature"
        label = "Temperature"
        reverse = True
        unit = "°C"
        
        if "salinity" in msg:
            metric_name = "salinity"
            label = "Salinity"
            unit = "PSU"
        elif "depth" in msg or "deepest" in msg:
            metric_name = "depth"
            label = "Depth"
            unit = "m"
        elif "chlorophyll" in msg:
            metric_name = "chlorophyll"
            label = "Chlorophyll"
            unit = "mg/m³"
        elif "oxygen" in msg:
            metric_name = "oxygen"
            label = "Oxygen"
            unit = "mL/L"
            
        if "lowest" in msg or "coldest" in msg:
            reverse = False

        sorted_floats = sorted(latest_data, key=lambda x: x[metric_name], reverse=reverse)
        
        rows = []
        for idx, item in enumerate(sorted_floats[:5]):
            rows.append(f"| {idx+1} | {item['id']} | {item['name']} | {item['region']} | {item[metric_name]} {unit} |")
            
        rows_text = "\n".join(rows)

        text = f"""# 🏆 Float Ranking Matrix: {label}

Here are the top active telemetry sensors ranked by **{label}** ({'highest to lowest' if reverse else 'lowest to highest'}):

| Rank | Float ID | Name | Region | Value |
| :--- | :--- | :--- | :--- | :--- |
{rows_text}

### AI Insights & Environmental Significance
- **Highest Reading**: Float `{sorted_floats[0]['id']}` in `{sorted_floats[0]['region']}` leads with `{sorted_floats[0][metric_name]} {unit}`.
- **Implication**: These regional values point to active convective currents or local climatological conditions.
"""
        intent = {
            "query_type": "summary",
            "region_filter": "all",
            "float_id_filter": None,
            "comparison_regions": None,
            "confidence_level": "High",
            "suggested_questions": ["Explain " + label, "Today's Summary", "Forecast"]
        }
        return text, intent

    # 6. Educational explanations
    if any(k in msg for k in ["explain", "what is", "define", "definition"]):
        metric = "salinity"
        if "chlorophyll" in msg:
            metric = "chlorophyll"
        elif "pressure" in msg:
            metric = "pressure"
        elif "oxygen" in msg:
            metric = "oxygen"
        elif "sst" in msg or "temperature" in msg:
            metric = "sst"

        details = {
            "salinity": {
                "title": "Ocean Salinity",
                "def": "Ocean salinity refers to the concentration of dissolved salts (mostly sodium chloride) in seawater, typically measured in Practical Salinity Units (PSU).",
                "importance": "It drives global ocean circulation (the thermohaline conveyor belt) by affecting water density. Higher salinity makes water denser, causing it to sink.",
                "formula": "Salinity (g/kg) ≈ 1.80655 × Chlorinity (g/kg)",
                "example": "The Red Sea has high salinity (approx. 40 PSU) due to high evaporation, while the Baltic Sea has low salinity (approx. 7 PSU) due to heavy river runoff.",
                "argo": "ARGO floats measure electrical conductivity of water, which is directly converted into salinity using pressure and temperature measurements.",
                "impact": "Shifts in salinity profiles indicate changing evaporation patterns and melting glaciers, both major climate indicators."
            },
            "chlorophyll": {
                "title": "Chlorophyll-A Concentration",
                "def": "Chlorophyll-A is the primary green pigment in phytoplankton, used to capture light for photosynthesis.",
                "importance": "It is a proxy for phytoplankton biomass and indicator of ocean biological productivity and health.",
                "formula": "Measured optically via fluorescence (in mg/m³).",
                "example": "Coastal upwelling zones exhibit high chlorophyll concentrations due to nutrient supply from deep waters.",
                "argo": "Bio-ARGO floats carry optical fluorometers to project light and measure backscatter/fluorescence intensity.",
                "impact": "Algal blooms or marine oligotrophy signal shifts in the marine food web and carbon capture capacity."
            },
            "pressure": {
                "title": "Mooring & Profiling Pressure",
                "def": "Pressure is the force per unit area exerted by water weight, measured in decibars (dbar).",
                "importance": "Pressure is used to compute depth, as 1 dbar of pressure roughly corresponds to 1 meter of depth.",
                "formula": "Depth (m) ≈ Pressure (dbar) / (density * gravity)",
                "example": "At the bottom of the Mariana Trench, hydrostatic pressure reaches over 1,000 atmospheres.",
                "argo": "CTD sensors use piezo-resistive pressure sensors to determine the float's position in the water column.",
                "impact": "Accurate pressure calibration is vital to map vertical ocean profiles correctly."
            },
            "oxygen": {
                "title": "Dissolved Oxygen (DO)",
                "def": "Dissolved oxygen is the amount of gaseous oxygen dissolved in seawater, critical for respiration of marine life.",
                "importance": "DO tells us about photosynthesis, respiration rates, and the expansion of marine dead zones (hypoxia).",
                "formula": "Concentration typically measured in milliliters per liter (mL/L) or micromoles per kilogram (µmol/kg).",
                "example": "Deep ocean oxygen minimum zones occur where respiration consumes oxygen without replenishment.",
                "argo": "Optical oxygen optodes measure phase shifts in luminescent foils to register dissolved oxygen concentrations.",
                "impact": "Deoxygenation threatens fisheries and alters global geochemical cycles."
            },
            "sst": {
                "title": "Sea Surface Temperature (SST)",
                "def": "SST is the water temperature close to the ocean surface, typically the top few meters.",
                "importance": "It affects global weather, hurricane formation, coral bleaching events, and heat distribution.",
                "formula": "Expressed in degrees Celsius (°C).",
                "example": "El Niño is characterized by prolonged warming of SST in the central Pacific Ocean.",
                "argo": "Standard profiling floats record SST during the final phase of their ascent to the surface.",
                "impact": "Rising SST causes widespread thermal stress on marine ecosystems, leading to coral bleaching."
            }
        }
        
        info = details[metric]
        text = f"""# 📘 Educational Guide: {info['title']}

### Definition
{info['def']}

### Why It Matters
{info['importance']}

### Scientific Formula / Measurement
- `{info['formula']}`

### Real-World Example
- {info['example']}

### How ARGO Floats Measure It
- {info['argo']}

### Environmental & Climatological Impact
- {info['impact']}

---
*Analyst Tip: Check the Charts and Table widgets in the chat to see real observations for {info['title']}.*
"""
        intent = {
            "query_type": "general",
            "region_filter": None,
            "float_id_filter": None,
            "comparison_regions": None,
            "confidence_level": "Educational",
            "suggested_questions": ["Explain Salinity" if metric != "salinity" else "Explain Chlorophyll", "Today's Summary", "Forecast"]
        }
        return text, intent

    # 7. Forecast
    if any(k in msg for k in ["forecast", "prediction", "predict"]):
        text = f"""# 🔮 AI Ocean & Weather Forecast

Projections compiled for July 12, 2026 – July 18, 2026.

### Forecast Dashboard & Predictions
- **Sea Surface Temperature**: Warm anomaly (+0.4 °C) predicted to persist in Indian Goa sector.
- **Salinity Prediction**: Expected to drop slightly in Chennai basin due to monsoon predictions.
- **Atmospheric Conditions**: Wind speed up to 8.5 m/s, waves reaching 1.8 m in Tasman Sea.

### Ocean Health Prediction Matrix
| Date | Temp Forecast | Wave Height | Health Score | Confidence |
| :--- | :--- | :--- | :--- | :--- |
| Tomorrow | {avg_temp} °C | {avg_wave} m | 85/100 | 98% |
| Next Week | {round(avg_temp + 0.3, 2)} °C | {round(avg_wave + 0.1, 2)} m | 84/100 | 88% |

### AI Analyst Recommendation
- Moored buoys should be set to high frequency profiling to capture sudden thermocline shifts.
"""
        intent = {
            "query_type": "forecast",
            "region_filter": "all",
            "float_id_filter": None,
            "comparison_regions": None,
            "confidence_level": "Medium-High (88%)",
            "suggested_questions": ["Today's Summary", "Download CSV", "Show floats near India"]
        }
        return text, intent

    # 8. Downloads
    if any(k in msg for k in ["download", "export", "csv", "json", "pdf", "excel"]):
        text = f"""# 💾 Telemetry Data Export Panel

The telemetry data log is prepared. Choose your format below to export active sensor logs:

- **Download CSV**: Standard comma-separated variables containing all latest float observations.
- **Download Excel**: Structured spreadsheet document.
- **Download JSON**: Hierarchical data objects for developers.
- **PDF Report**: Print formatted document containing executive summaries and maps.

*Use the quick-action export buttons displayed directly in the chat panel below.*
"""
        intent = {
            "query_type": "downloads_only",
            "region_filter": "all",
            "float_id_filter": None,
            "comparison_regions": None,
            "confidence_level": "100%",
            "suggested_questions": ["Today's Summary", "Show floats near India", "Forecast"]
        }
        return text, intent

    # 9. Metric Specifics
    metric_type = None
    metric_label = None
    if "temp" in msg:
        metric_type = "temp"
        metric_label = "Temperature"
        val = f"{avg_temp} °C"
    elif "salinity" in msg:
        metric_type = "salinity"
        metric_label = "Salinity"
        val = f"{avg_sal} PSU"
    elif "pressure" in msg:
        metric_type = "general"
        metric_label = "Pressure"
        val = f"{avg_press} dbar"
    elif "oxygen" in msg:
        metric_type = "oxygen"
        metric_label = "Oxygen"
        val = f"{avg_ox} mL/L"
    elif "chlorophyll" in msg:
        metric_type = "chlorophyll"
        metric_label = "Chlorophyll"
        val = f"{avg_chlor} mg/m³"

    if metric_type:
        text = f"""# 📈 Metric Dashboard: {metric_label}

Active global observation summary for **{metric_label}**:

- **Current Global Average**: {val}
- **Sensor Count**: {total_floats} report parameters.
- **Regional Variation**: Higher readings detected near equatorial sectors, in line with seasonal trends.

### Historical Trend & AI Insights
- Telemetry shows stable baseline profiles.
- Continued monitoring is advised to watch for temperature/salinity gradients.
"""
        intent = {
            "query_type": metric_type,
            "region_filter": "all",
            "float_id_filter": None,
            "comparison_regions": None,
            "confidence_level": "High",
            "suggested_questions": ["Explain " + metric_label, "Today's Summary", "Forecast"]
        }
        return text, intent

    # 10. General fallback
    responses = [
        f"Hello! I am **FloatChat AI**, your oceanographic data assistant. Ask me questions about global ocean health, ARGO float positions, comparisons between basins, or telemetry statistics.\n\n### Suggested Queries:\n- *Today's Ocean Summary*\n- *Show floats near India*\n- *Explain Salinity*",
        f"Hi, I'm **FloatChat AI**. I help you analyze marine ecosystems, temperature trends, and profiling float telemetry.\n\n### Try asking:\n- *Compare India vs Australia*\n- *Forecast*\n- *Where is Float 5906831?*",
        f"Welcome to **FloatChat AI**! I analyze data from drifting buoys and fixed stations to give you deep ocean insights.\n\n### Try asking:\n- *Highest Salinity*\n- *Explain Chlorophyll*\n- *Show today's report*"
    ]
    text = random.choice(responses)
    intent = {
        "query_type": "general",
        "region_filter": None,
        "float_id_filter": None,
        "comparison_regions": None,
        "confidence_level": "N/A",
        "suggested_questions": ["Today's Summary", "Show floats near India", "Explain Salinity"]
    }
    return text, intent

def process_chat_query_llm(user_message: str, history: list) -> tuple[str, dict]:
    if not client:
        raise ValueError("LLM client not initialized")
        
    response = client.chat.completions.create(
        model=model_name,
        messages=history,
        temperature=0.7,
    )
    response_text = response.choices[0].message.content
    
    parts = response_text.split("[UI_INTENT]")
    if len(parts) >= 2:
        text = parts[0].strip()
        intent_str = parts[1].strip()
        try:
            if intent_str.startswith("```"):
                lines = intent_str.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].strip() == "```":
                    lines = lines[:-1]
                intent_str = "\n".join(lines).strip()
            
            intent = json.loads(intent_str)
        except Exception:
            intent = {"query_type": "general"}
    else:
        text = response_text.strip()
        intent = {"query_type": "general"}
        
    return text, intent

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    conversation_id = request.conversation_id
    user_message = request.message
    
    # Generate dynamic system prompt containing the latest data
    dynamic_prompt = get_system_prompt()
    
    # Initialize conversation history if new
    if conversation_id not in CONVERSATIONS:
        CONVERSATIONS[conversation_id] = [{"role": "system", "content": dynamic_prompt}]
    else:
        # Keep system prompt updated with latest sensor states
        CONVERSATIONS[conversation_id][0] = {"role": "system", "content": dynamic_prompt}
    
    # Append current user message
    CONVERSATIONS[conversation_id].append({"role": "user", "content": user_message})
    
    # Keep context memory within bounds (last 15 messages)
    history = CONVERSATIONS[conversation_id]
    if len(history) > 16:
        history = [history[0]] + history[-15:]
        CONVERSATIONS[conversation_id] = history

    async def event_generator():
        # Get raw response text and intent
        try:
            if client:
                text, intent = process_chat_query_llm(user_message, CONVERSATIONS[conversation_id])
            else:
                text, intent = process_chat_query(user_message)
        except Exception as e:
            # Fallback to local processing if LLM call fails
            try:
                text, intent = process_chat_query(user_message)
            except Exception as e2:
                text = f"An error occurred in local processing: {str(e2)}"
                intent = {"query_type": "general"}

        # Simulate natural streaming by yielding chunks
        chunk_size = 8
        delay = 0.005
        
        for i in range(0, len(text), chunk_size):
            chunk = text[i:i+chunk_size]
            yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
            await asyncio.sleep(delay)
            
        CONVERSATIONS[conversation_id].append({"role": "assistant", "content": text.strip()})
        
        # Build and yield structured payload
        payload = build_structured_data(intent)
        final_data = {
            "type": "data",
            "summary": text.strip(),
            "activeComponents": payload["activeComponents"],
            "cards": payload["cards"],
            "mapData": payload["mapData"],
            "chartData": payload["chartData"],
            "tableData": payload["tableData"],
            "downloads": payload["downloads"],
            "comparisonData": payload["comparisonData"],
            "meta": payload["meta"],
            "suggestedQuestions": intent.get("suggested_questions")
        }
        yield f"data: {json.dumps(final_data)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
