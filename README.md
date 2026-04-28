# IFUSP Heavy-Ion Group Website

Jekyll website for the relativistic heavy-ion physics group of Prof. Matthew Luzum at the Institute of Physics, University of São Paulo (IFUSP).

## Site Structure

```
_config.yml               Site configuration
index.md                  Home page
members.md                Members page (rendered from _data/members.yml)
research.md               Research overview
publications.md           Publications (rendered from _data/publications.yml)
contact.md                Contact information
_data/
  members.yml             Group member list with active/former status
  publications.yml        Publication database
assets/
  main.scss               Custom styles (extends minima theme)
_includes/
  custom-head.html        OpenGraph and theme-color meta tags
scripts/
  update_publications_from_inspirehep.py   INSPIRE update script
```

## Managing Members

Edit `_data/members.yml`. Each member entry can have:

| Field | Description |
|---|---|
| `name` | Full name |
| `active` | `true` = current member; `false` = former member |
| `inspire_bai` | INSPIRE-HEP author BAI (e.g. `M.Luzum.1`) — used for publication search |
| `orcid` | ORCID identifier |
| `lattes` | CNPq Lattes ID number |
| `url` | Personal or profile page |
| `note` | Short note (e.g. current position for former members) |
| `title` | Academic title or position |

To find a member's INSPIRE BAI: search https://inspirehep.net/authors and copy the identifier from their profile URL or the "Author" field shown on papers.

## Updating Publications

```bash
pip install requests pyyaml

# Fetch all papers from active members (uses inspire_bai fields in members.yml)
python scripts/update_publications_from_inspirehep.py

# Preview without writing
python scripts/update_publications_from_inspirehep.py --dry-run

# Add a specific paper by arXiv ID
python scripts/update_publications_from_inspirehep.py --arxiv 2311.02210

# Fill in DOIs that are missing
python scripts/update_publications_from_inspirehep.py --update-missing-dois
```

The script searches INSPIREHEP for all papers where any active member with an `inspire_bai` is listed as an author. New papers are added to the first category in `publications.yml`; existing entries are updated with any missing fields.

## Running Locally

```bash
gem install bundler jekyll
bundle init
# Add to Gemfile:  gem "minima"  and  gem "jekyll-feed"
bundle install
bundle exec jekyll serve
```

Then open http://localhost:4000.

## Deploying to GitHub Pages

Push to the `main` branch of `IFUSP-Heavy-Ions/IFUSP-Heavy-Ions.github.io`. GitHub Pages will build and publish automatically.
