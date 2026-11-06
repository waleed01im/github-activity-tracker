import json
from pathlib import Path

import pandas as pd

IN_FILE = Path("data/discovered_repos.json")
OUT_FILE = Path("data/selected_repos.json")

if __name__ == "__main__":
    discovered = json.loads(IN_FILE.read_text(encoding="utf-8"))

    selected = {}
    for category, items in discovered.items():
        df = pd.DataFrame(items)
        picks = pd.concat([df.head(3), df.iloc[5:7], df.iloc[9:10]])
        selected[category] = picks["full_name"].tolist()

    for category, names in selected.items():
        print(f"\n# {category}")
        for name in names:
            print(f"  {name}")

    OUT_FILE.write_text(json.dumps(selected, indent=2), encoding="utf-8")
    print(f"\nSaved to {OUT_FILE}")