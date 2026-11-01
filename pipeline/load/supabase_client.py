from supabase import create_client

from pipeline.config import SUPABASE_SERVICE_KEY, SUPABASE_URL


def get_client():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)