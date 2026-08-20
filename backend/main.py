from fastapi import FastAPI, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
import sqlite3
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    llm_model = genai.GenerativeModel('gemini-2.5-flash')
else:
    llm_model = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    conn = sqlite3.connect('space_data.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.post("/api/generate_summary")
async def generate_summary(payload: Dict[str, Any] = Body(...)):
    if not llm_model:
        return {"summary": "Error: GEMINI_API_KEY not configured in .env file."}
    
    query = payload.get("query", "Unknown query")
    chart_data = payload.get("chartData", [])
    config = payload.get("config", {})
    
    query_context = f'The user asked: "{query}"' if query else "The user manually built a custom chart in the data sandbox."
    
    prompt = f"""You are an expert aerospace data analyst.
{query_context}

Here is the aggregated data plotted on the chart:
{chart_data}

Chart Configuration:
{config}

Write a highly concise, insightful 1 to 2 sentence summary interpreting this data. Do not use formatting like markdown bolding or bullet points. Act as a direct, intelligent assistant summarizing the key takeaway.
"""
    try:
        response = llm_model.generate_content(prompt)
        return {"summary": response.text.strip()}
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "Quota exceeded" in error_msg:
            return {"summary": "The AI is cooling down (API rate limit reached). Please wait about a minute before generating more insights!"}
        return {"summary": "Failed to generate AI insight. Please try again later."}

@app.get("/api/launches")
def get_launches(agency: Optional[str] = None, start_year: Optional[int] = None, end_year: Optional[int] = None):
    conn = get_db_connection()
    query = "SELECT dashboard_agency as agency, COUNT(*) as total_launches, SUM(CASE WHEN is_success = 1 THEN 1 ELSE 0 END) as successful_launches FROM launches WHERE 1=1"
    params = []
    if agency:
        query += " AND dashboard_agency = ?"; params.append(agency)
    if start_year:
        query += " AND year >= ?"; params.append(start_year)
    if end_year:
        query += " AND year <= ?"; params.append(end_year)
    query += " GROUP BY dashboard_agency ORDER BY total_launches DESC"
    res = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in res]

@app.get("/api/timeline")
def get_timeline(agency: Optional[str] = None, start_year: Optional[int] = None, end_year: Optional[int] = None):
    conn = get_db_connection()
    query = "SELECT year, dashboard_agency as agency, COUNT(*) as launches FROM launches WHERE 1=1"
    params = []
    if agency:
        query += " AND dashboard_agency = ?"; params.append(agency)
    if start_year:
        query += " AND year >= ?"; params.append(start_year)
    if end_year:
        query += " AND year <= ?"; params.append(end_year)
    query += " GROUP BY year, dashboard_agency ORDER BY year ASC"
    res = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in res]

@app.get("/api/rockets")
def get_rockets(agency: Optional[str] = None, start_year: Optional[int] = None, end_year: Optional[int] = None):
    conn = get_db_connection()
    query = "SELECT rocket_type, dashboard_agency as agency, COUNT(*) as total_flown, SUM(CASE WHEN is_success = 1 THEN 1 ELSE 0 END) as success_count FROM launches WHERE 1=1"
    params = []
    if agency:
        query += " AND dashboard_agency = ?"; params.append(agency)
    if start_year:
        query += " AND year >= ?"; params.append(start_year)
    if end_year:
        query += " AND year <= ?"; params.append(end_year)
    query += " GROUP BY rocket_type, dashboard_agency ORDER BY total_flown DESC LIMIT 10"
    res = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in res]

@app.get("/api/success_over_time")
def get_success_over_time(agency: Optional[str] = None, start_year: Optional[int] = None, end_year: Optional[int] = None):
    conn = get_db_connection()
    query = "SELECT year, SUM(CASE WHEN is_success = 1 THEN 1 ELSE 0 END) as successful, SUM(CASE WHEN is_success = 0 THEN 1 ELSE 0 END) as failed FROM launches WHERE 1=1"
    params = []
    if agency:
        query += " AND dashboard_agency = ?"; params.append(agency)
    if start_year:
        query += " AND year >= ?"; params.append(start_year)
    if end_year:
        query += " AND year <= ?"; params.append(end_year)
    query += " GROUP BY year ORDER BY year ASC"
    res = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in res]

@app.get("/api/all_data")
def get_all_data(agency: Optional[str] = None, start_year: Optional[int] = None, end_year: Optional[int] = None):
    conn = get_db_connection()
    query = "SELECT * FROM launches WHERE 1=1"
    params = []
    if agency:
        query += " AND dashboard_agency = ?"; params.append(agency)
    if start_year:
        query += " AND year >= ?"; params.append(start_year)
    if end_year:
        query += " AND year <= ?"; params.append(end_year)
    res = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in res]

@app.get("/api/raw_data")
def get_raw_data(page: int = 1, limit: int = 50, search: Optional[str] = None, agency: Optional[str] = None, start_year: Optional[int] = None, end_year: Optional[int] = None, status: Optional[str] = None, sort_col: Optional[str] = 'year', sort_dir: Optional[str] = 'desc'):
    conn = get_db_connection()
    query = "SELECT *, dashboard_agency as agency, real_agency as display_agency FROM launches WHERE 1=1"
    count_query = "SELECT COUNT(*) FROM launches WHERE 1=1"
    params = []
    if agency:
        query += " AND dashboard_agency = ?"; count_query += " AND dashboard_agency = ?"; params.append(agency)
    if start_year:
        query += " AND year >= ?"; count_query += " AND year >= ?"; params.append(start_year)
    if end_year:
        query += " AND year <= ?"; count_query += " AND year <= ?"; params.append(end_year)
    if status:
        if status == 'Success':
            query += " AND is_success = 1"; count_query += " AND is_success = 1"
        elif status == 'Failure':
            query += " AND is_success = 0"; count_query += " AND is_success = 0"
    if search:
        query += " AND (rocket_type LIKE ? OR success_status LIKE ? OR mission LIKE ? OR real_agency LIKE ?)"
        count_query += " AND (rocket_type LIKE ? OR success_status LIKE ? OR mission LIKE ? OR real_agency LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%", f"%{search}%"])
    
    valid_sort_cols = {'year', 'real_agency', 'mission', 'rocket_type', 'success_status'}
    if sort_col not in valid_sort_cols:
        sort_col = 'year'
    if sort_dir.lower() not in ['asc', 'desc']:
        sort_dir = 'desc'
        
    query += f" ORDER BY {sort_col} {sort_dir} LIMIT ? OFFSET ?"
    offset = (page - 1) * limit
    total_count = conn.execute(count_query, params).fetchone()[0]
    params.extend([limit, offset])
    data = conn.execute(query, params).fetchall()
    conn.close()
    return { "data": [dict(row) for row in data], "total": total_count, "page": page, "limit": limit }
