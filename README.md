# IFUSP Heavy-Ion Group Website

Jekyll website for the Relativistic Heavy-Ion Physics group of Prof. Matthew Luzum at the Institute of Physics, University of São Paulo (IFUSP): [ifusp-heavy-ions.github.io](https://ifusp-heavy-ions.github.io).

Designed as a sibling site to [The ExTrEMe Collaboration](https://www.extreme-collaboration.science), sharing the same dependency-free layout and filterable component system with an IFUSP Blue, Cherenkov Cyan, and Gold color palette.

## Site Structure

```
_config.yml               Site configuration
index.html                Home page (with animated collision & static event-display hero toggle)
research.html             Research themes and open-source software
members.html              Members page (rendered from _data/members.yml)
publications.html         Filterable publications page (rendered from _data/publications.yml)
presentations.html        Filterable presentations page (rendered from _data/talks.yml)
contact.html              Contact information and prospective student opportunities
404.html                  Not-found page
_data/
  members.yml             Group member list with active/former status
  publications.yml        Publication database
  talks.yml               Presentations database
  navigation.yml          Header and footer navigation links
_layouts/
  default.html            Base HTML skeleton
  page.html               Inner page hero and container
_includes/
  head.html               Fonts, stylesheet, favicon, and SEO tags
  header.html             Sticky site header
  footer.html             Site footer
  logo.html               IFUSP Heavy-Ion SVG mark
  hero-art.html           Static heavy-ion event display & flow harmonic SVG banner
  icon.html               Inline SVG icons
  member-links.html       Lattes / ORCID / INSPIRE / Website / Presentations links
  publication.html        Single publication entry
  talk.html               Single presentation entry
assets/
  css/site.css            Token-driven stylesheet with light and dark modes
  js/site.js              Mobile menu, hero mode toggle, and list search/filters
  js/collision.js         Heavy-ion collision hero canvas animation
  images/favicon.svg      Site favicon
scripts/
  update_publications_from_inspirehep.py   INSPIRE-HEP publication sync script
```

## Managing Members

Edit [`_data/members.yml`](_data/members.yml). Each member entry can have:

| Field | Description |
|---|---|
| `name` | Full name |
| `active` | `true` = current member; `false` = moved automatically to **Former Members & Alumni** |
| `title` | Academic title or position (e.g., `PhD Student`, `Postdoctoral Researcher`) |
| `institution` | Institution string |
| `inspire_bai` | INSPIRE-HEP author BAI (e.g. `M.Luzum.1`) — used for publication search |
| `orcid` | ORCID identifier (e.g. `0000-0002-0367-7055`) |
| `lattes` | CNPq Lattes 16-digit ID number |
| `url` | Personal or profile page URL |
| `note` | Short note shown for former members (e.g. current position) |

## Adding a Presentation

Add a new entry at the top of [`_data/talks.yml`](_data/talks.yml):

```yaml
- date: "2026-09"                    # year-month, in quotes
  speaker: Matthew Luzum             # exact name from _data/members.yml
  type: Talk                         # Plenary talk | Invited talk | Talk | Flash talk | Seminar | Colloquium | Poster
  title: "Title of the presentation"
  event: Conference or Seminar Name
  location: City, Country            # or Online
  url: https://indico.cern.ch/...    # optional: slides or contribution page
```

## Updating Publications

```bash
pip install requests pyyaml

# Fetch papers from active members since 2019 (uses inspire_bai fields in members.yml)
python scripts/update_publications_from_inspirehep.py --since-year 2019

# Preview without writing
python scripts/update_publications_from_inspirehep.py --since-year 2019 --dry-run

# Add a specific paper by arXiv ID
python scripts/update_publications_from_inspirehep.py --arxiv 2311.02210

# Fill in DOIs that are missing
python scripts/update_publications_from_inspirehep.py --update-missing-dois
```

## Running Locally

```bash
bundle install
bundle exec jekyll serve --livereload
```

Then open http://localhost:4000.
