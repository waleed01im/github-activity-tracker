import json
from pathlib import Path

import pandas as pd

IN_FILE = Path("data/discovered_repos.json")
OUT_FILE = Path("data/selected_repos.json")
TOP_N = 6

if __name__ == "__main__":
    discovered_repos = json.loads(IN_FILE.read_text(encoding="utf-8"))

    selected_repos = {}
    for category, repos in discovered_repos.items():
        df = pd.DataFrame(repos)
        selected_repos[category] = df.head(TOP_N)["full_name"].tolist()

    for category, names in selected_repos.items():
        print(f"\n # {category}")
        for name in names:
            print(f'    "{name}",')

    OUT_FILE.write_text(json.dumps(selected_repos, indent=2), encoding="utf-8")
    print(f"\nSaved to {OUT_FILE}")