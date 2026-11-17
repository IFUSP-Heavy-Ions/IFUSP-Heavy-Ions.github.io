---
layout: page
title: Publications
permalink: /publications/
---

{% for group in site.data.publications %}
## {{ group.category }}

{% assign entries = group.items | sort: "year" | reverse %}
<ul class="pub-list">
{% for paper in entries %}
  <li class="pub-item">
    <span class="pub-year">{{ paper.year }}</span>
    <div class="pub-body">
      <div class="pub-title">{{ paper.title }}</div>
      {% if paper.authors %}<div class="pub-authors">{{ paper.authors }}</div>{% endif %}
      <div class="pub-meta">
        {% if paper.venue %}<span class="pub-venue">{{ paper.venue }}</span>{% endif %}
        {% if paper.note %}<span class="pub-note">({{ paper.note }})</span>{% endif %}
      </div>
      {% if paper.doi or paper.arxiv or paper.url %}
      <div class="pub-links">
        {% if paper.doi %}<a href="https://doi.org/{{ paper.doi }}">DOI: {{ paper.doi }}</a>{% endif %}
        {% if paper.arxiv %}<a href="https://arxiv.org/abs/{{ paper.arxiv }}">arXiv:{{ paper.arxiv }}</a>{% endif %}
        {% if paper.url %}<a href="{{ paper.url }}">Link</a>{% endif %}
      </div>
      {% endif %}
    </div>
  </li>
{% endfor %}
</ul>
{% endfor %}
