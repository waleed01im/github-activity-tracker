from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import time

from pipeline.aggregate.build_stats import build_stats
from pipeline.load.supabase_client import get_client

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:5173", 
    #         "https://tracegit.vercel.app"], 
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") 
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# In-Memory Cache Setup
CACHE_STORE = {} 
CACHE_TTL = 600 # 10 minutes

@app.get("/")
def read_root():
    return {"status": "FastAPI is running perfectly!"}

# 1. VERSION CHECK ENDPOINT
@app.get("/api/version")
def get_data_version():
    try:
        response = supabase.table('dashboard_stats').select('updated_at').eq('id', 1).execute()
        if response.data:
            return {"updated_at": response.data[0]['updated_at']}
        return {"updated_at": None}
    except Exception as e:
        print(f"Version Error: {e}")
        return {"updated_at": None}

# 2. DASHBOARD DATA ENDPOINT
@app.get("/api/dashboard")
def get_dashboard_data(repo: str = "All", days: str = "all", client_version: str = None):
    try:
        cache_key = f"{repo}_{days}"
        current_time = time.time()
        days_int = 3650 if days == "all" else int(days)

        if cache_key in CACHE_STORE:
            cached_result, cached_time = CACHE_STORE[cache_key]
            cached_updated_at = cached_result.get("updatedAt")
            
            is_cache_valid = (current_time - cached_time) < CACHE_TTL

            if client_version and client_version != cached_updated_at:
                print(f"⚠️ Client has newer version. Bypassing cache for {cache_key}")
                is_cache_valid = False 
                
            if is_cache_valid:
                print(f"⚡ Serving from FastAPI CACHE: {cache_key}")
                return cached_result

        if repo == "All" and days == "all":
            print(f"Fast Fetching DEFAULT data from Supabase dashboard_stats")
            response = supabase.table('dashboard_stats').select('data').eq('id', 1).execute()
            if not response.data:
                raise HTTPException(status_code=404, detail="Data not found")
            calculated_data = response.data[0]['data']
        else:
            print(f"Calculating CUSTOM filter via Pandas: {cache_key}")
            client = get_client()
            calculated_data = build_stats(client, days=days_int, target_repo=repo)

        CACHE_STORE[cache_key] = (calculated_data, current_time)
        return calculated_data
        
    except Exception as e:
        print(f"Dashboard Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))