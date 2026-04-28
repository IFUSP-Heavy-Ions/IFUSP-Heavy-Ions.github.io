#!/usr/bin/env python3
"""
Update publications.yml from INSPIREHEP API using the group member list.

Searches for papers authored by any **active** member who has an `inspire_bai`
(INSPIRE author BAI identifier) listed in _data/members.yml.

Usage:
  # Search by active members (default)
  python scripts/update_publications_from_inspirehep.py

  # Search by a specific arXiv ID
  python scripts/update_publications_from_inspirehep.py --arxiv 2311.02210

  # Fill in missing DOIs for entries that already have an arXiv ID
  python scripts/update_publications_from_inspirehep.py --update-missing-dois

  # Preview changes without writing anything
  python scripts/update_publications_from_inspirehep.py --dry-run

  # Use a custom INSPIRE query instead of the member-derived one
  python scripts/update_publications_from_inspirehep.py --query "a M.Luzum.1"

Finding INSPIRE BAI identifiers
  Open https://inspirehep.net/authors and search for the person.
  The BAI appears in the URL (e.g. https://inspirehep.net/authors/1019100 →
  search by recid, or use the "Find" field "a Surname.F.N").
  Add the BAI to _data/members.yml under `inspire_bai:`.
"""

import re
import sys
import argparse
from pathlib import Path

import requests
import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
MEMBERS_YAML = REPO_ROOT / "_data" / "members.yml"
PUBLICATIONS_YAML = REPO_ROOT / "_data" / "publications.yml"
INSPIRE_API = "https://inspirehep.net/api/literature"

# ── helpers ──────────────────────────────────────────────────────────────────

def load_members():
    """Load _data/members.yml and return a list of active member dicts."""
    with open(MEMBERS_YAML) as f:
        groups = yaml.safe_load(f) or []
    active = []
    for group in groups:
        for m in group.get("members", []):
            if m.get("active"):
                active.append(m)
    return active


def build_member_query(active_members):
    """
    Build an INSPIRE query that ORs together author searches for all active
    members that have an `inspire_bai` field.
    """
    bais = [m["inspire_bai"] for m in active_members if m.get("inspire_bai")]
    if not bais:
        print(
            "✗ No active members with `inspire_bai` found in members.yml.\n"
            "  Add `inspire_bai: Surname.F.N` to each member in _data/members.yml.",
            file=sys.stderr,
        )
        sys.exit(1)
    print(f"  Searching INSPIRE for {len(bais)} author(s):", file=sys.stderr)
    for bai in bais:
        print(f"    · {bai}", file=sys.stderr)
    parts = " OR ".join(f"a {bai}" for bai in bais)
    return f"({parts})"


def fetch_inspire(query, size=200):
    """Fetch results from the INSPIREHEP API."""
    params = {"q": query, "size": size, "sort": "mostrecent"}
    try:
        r = requests.get(INSPIRE_API, params=params, timeout=15)
        r.raise_for_status()
        hits = r.json().get("hits", {}).get("hits", [])
        print(f"✓ Found {len(hits)} results from INSPIREHEP", file=sys.stderr)
        return hits
    except requests.RequestException as e:
        print(f"✗ Error querying INSPIREHEP: {e}", file=sys.stderr)
        return []


def parse_inspire_record(record):
    """Extract publication info from an INSPIREHEP record dict."""
    meta = record.get("metadata", {})

    # Title
    title = None
    if meta.get("titles"):
        title = meta["titles"][0].get("title")

    # Authors
    authors = ""
    if meta.get("authors"):
        names = [a.get("full_name") for a in meta["authors"] if a.get("full_name")]
        if names:
            authors = names[0] + " et al." if len(names) > 3 else ", ".join(names)

    # Year
    year = None
    pub_info = meta.get("publication_info", [{}])
    year = pub_info[0].get("year") if pub_info else None
    if not year and meta.get("preprint_date"):
        year = int(meta["preprint_date"][:4])

    # DOI
    doi = None
    if meta.get("dois"):
        doi = meta["dois"][0].get("value")

    # arXiv ID
    arxiv = None
    if meta.get("arxiv_eprints"):
        arxiv = meta["arxiv_eprints"][0].get("value")

    # Venue
    venue = ""
    if pub_info and pub_info[0]:
        pi = pub_info[0]
        if pi.get("journal_title"):
            venue = pi["journal_title"]
            if pi.get("volume"):
                venue += f" {pi['volume']}"
            if pi.get("artid"):
                venue += f", {pi['artid']}"
            elif pi.get("page_start"):
                venue += f", {pi['page_start']}"

    entry = {}
    if year:
        entry["year"] = int(year) if isinstance(year, (str, float)) else year
    if title:
        entry["title"] = title
    if authors:
        entry["authors"] = authors
    if venue:
        entry["venue"] = venue
    if doi:
        entry["doi"] = doi
    if arxiv:
        entry["arxiv"] = arxiv

    return entry


# ── YAML I/O ─────────────────────────────────────────────────────────────────

def load_yaml():
    with open(PUBLICATIONS_YAML) as f:
        return yaml.safe_load(f) or []


def save_yaml(data):
    with open(PUBLICATIONS_YAML, "w") as f:
        yaml.dump(data, f, sort_keys=False, allow_unicode=True, default_flow_style=False)
    # Ensure arXiv IDs that look like floats are quoted
    with open(PUBLICATIONS_YAML) as f:
        content = f.read()
    content = re.sub(r"(arxiv:\s+)([0-9]{4}\.[0-9]+)(\s|$)", r"\1'\2'\3", content)
    with open(PUBLICATIONS_YAML, "w") as f:
        f.write(content)


def find_entry_by_arxiv(yaml_data, arxiv_id):
    for category in yaml_data:
        for item in category.get("items", []):
            if str(item.get("arxiv", "")) == str(arxiv_id):
                return category, item
    return None, None


def merge_entries(existing, new):
    """Merge fields from `new` into `existing`, keeping existing values."""
    for key, value in new.items():
        if key not in existing or not existing[key]:
            existing[key] = value
    return existing


# ── update logic ─────────────────────────────────────────────────────────────

def update_publications(hits, dry_run=False):
    """Merge INSPIREHEP records into publications.yml."""
    yaml_data = load_yaml()
    added, updated = [], []

    for record in hits:
        entry = parse_inspire_record(record)
        if not entry.get("arxiv"):
            continue  # need arXiv ID as unique key

        arxiv_id = entry["arxiv"]
        category, existing = find_entry_by_arxiv(yaml_data, arxiv_id)

        if existing:
            old = dict(existing)
            merge_entries(existing, entry)
            if existing != old:
                updated.append((arxiv_id, old, existing))
        else:
            if yaml_data:
                yaml_data[0]["items"].append(entry)
            added.append((arxiv_id, entry))

    if added:
        print(f"\n📝 New entries ({len(added)}):", file=sys.stderr)
        for aid, e in added:
            print(f"  + {aid}: {e.get('title', '?')}", file=sys.stderr)
    if updated:
        print(f"\n✏️  Updated entries ({len(updated)}):", file=sys.stderr)
        for aid, old, new in updated:
            changes = [k for k in new if k not in old or old[k] != new[k]]
            print(f"  ~ {aid}: {', '.join(changes)}", file=sys.stderr)
    if not added and not updated:
        print("\n✓ Everything is already in sync!", file=sys.stderr)
        return

    if not dry_run:
        save_yaml(yaml_data)
        print(f"\n✓ Wrote {PUBLICATIONS_YAML}", file=sys.stderr)
    else:
        print("\n(dry-run: no files written)", file=sys.stderr)


def update_missing_dois(dry_run=False):
    """Query INSPIREHEP to fill in DOIs for entries that have arXiv but no DOI."""
    yaml_data = load_yaml()
    missing = [
        (str(item["arxiv"]), item)
        for cat in yaml_data
        for item in cat.get("items", [])
        if item.get("arxiv") and not item.get("doi")
    ]
    if not missing:
        print("\n✓ All entries already have DOIs!", file=sys.stderr)
        return
    print(f"\n🔍 {len(missing)} entries missing DOI — querying INSPIREHEP…", file=sys.stderr)
    updated = []
    for arxiv_id, item in missing:
        hits = fetch_inspire(f"arxiv:{arxiv_id}", size=1)
        if hits:
            dois = hits[0].get("metadata", {}).get("dois", [])
            if dois:
                doi = dois[0].get("value")
                if doi:
                    item["doi"] = doi
                    updated.append(arxiv_id)
                    print(f"  ✓ {arxiv_id} → {doi}", file=sys.stderr)
                    continue
        print(f"  ✗ {arxiv_id}: no DOI found", file=sys.stderr)
    if updated and not dry_run:
        save_yaml(yaml_data)
        print(f"\n✓ Updated {len(updated)} entries in {PUBLICATIONS_YAML}", file=sys.stderr)
    elif dry_run:
        print("\n(dry-run: no files written)", file=sys.stderr)


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--arxiv",
        metavar="ID",
        help="Add/update a single paper by arXiv ID (e.g. 2311.02210)",
    )
    parser.add_argument(
        "--query",
        metavar="QUERY",
        help="Run a custom INSPIRE query instead of the member-derived one",
    )
    parser.add_argument(
        "--update-missing-dois",
        action="store_true",
        help="Fill in missing DOIs for entries that already have an arXiv ID",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would change without writing files",
    )
    parser.add_argument(
        "--size",
        type=int,
        default=200,
        help="Maximum number of INSPIRE results to fetch (default: 200)",
    )
    args = parser.parse_args()

    if args.update_missing_dois:
        update_missing_dois(dry_run=args.dry_run)
        return

    if args.arxiv:
        query = f"arxiv:{args.arxiv}"
    elif args.query:
        query = args.query
    else:
        # Default: search by all active members with inspire_bai
        active = load_members()
        print(
            f"Loaded {len(active)} active member(s) from {MEMBERS_YAML.relative_to(REPO_ROOT)}",
            file=sys.stderr,
        )
        query = build_member_query(active)

    hits = fetch_inspire(query, size=args.size)
    update_publications(hits, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
