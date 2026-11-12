import sys

from pipeline.config import check_config
from pipeline.load.supabase_client import get_client
from pipeline.run_pipeline import run_etl
from pipeline.aggregate.build_stats import build_stats, save_to_supabase


def main():
    check_config()

    days = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    client = get_client()

    # ETL 
    failed = run_etl(client, days)

    # Stats 
    stats_ok = True
    try:
        stats = build_stats(client)
        save_to_supabase(client, stats)
        print(f"Dashboard stats refreshed ({len(stats['kpis'])} KPIs)")
    except Exception as e:
        print(f"WARNING: stats rebuild failed: {e}")
        stats_ok = False


    if failed:
        print("Failed repos:", failed)
    if failed or not stats_ok:
        sys.exit(1)


if __name__ == "__main__":
    main()