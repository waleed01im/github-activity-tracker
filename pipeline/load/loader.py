def dedupe(rows, key):
    unique = {}
    for row in rows:
        unique[row[key]] = row
    return list(unique.values())


def upsert_rows(client, table, rows, key, update=True, chunk=500):
    rows = dedupe(rows, key)
    if not rows:
        return 0

    for i in range(0, len(rows), chunk):
        batch = rows[i:i + chunk]
        client.table(table).upsert(
            batch, on_conflict=key, ignore_duplicates=not update
        ).execute()

    return len(rows)