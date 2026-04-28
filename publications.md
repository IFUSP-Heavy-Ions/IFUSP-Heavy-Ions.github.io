---
layout: page
title: Publications
permalink: /publications/
---

This page is rendered from `/_data/publications.yml`, which is kept up to date by running:

```
python scripts/update_publications_from_inspirehep.py
```

{% for group in site.data.publications %}
## {{ group.category }}

{% assign entries = group.items | sort: "year" | reverse %}
{% for paper in entries %}
- **{{ paper.year }}** — {{ paper.title }}

  _{{ paper.authors }}_

  {{ paper.venue }}{% if paper.note %} _({{ paper.note }})_{% endif %}

  {% if paper.doi %}[doi:{{ paper.doi }}](https://doi.org/{{ paper.doi }}){% endif %}{% if paper.arxiv %}{% if paper.doi %} \| {% endif %}[arXiv:{{ paper.arxiv }}](https://arxiv.org/abs/{{ paper.arxiv }}){% endif %}{% if paper.url %}{% if paper.doi or paper.arxiv %} \| {% endif %}[Link]({{ paper.url }}){% endif %}

{% endfor %}
{% endfor %}

---

## Maintenance

- New entries can be added by editing `/_data/publications.yml` or by running the INSPIRE update script.
- `doi`: store just the DOI identifier (e.g., `10.1103/PhysRevC.102.064909`); the URL is built automatically.
- `arxiv`: store just the arXiv ID (e.g., `2311.02210`); the URL is built automatically.
- `url`: use for non-DOI links (e.g., thesis repositories).
