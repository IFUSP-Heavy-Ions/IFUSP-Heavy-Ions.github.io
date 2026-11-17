---
layout: page
title: Members
permalink: /members/
---

## Current Members

{% for group in site.data.members %}
  {% assign active_members = group.members | where: "active", true %}
  {% if active_members.size > 0 %}

### {{ group.role }}

<div class="member-grid">
{% for m in active_members %}
  <div class="member-card">
    <div class="member-name">
      {% if m.url %}<a href="{{ m.url }}">{{ m.name }}</a>{% else %}{{ m.name }}{% endif %}
    </div>
    {% if m.title %}<div class="member-meta">{{ m.title }}</div>{% endif %}
    {% if m.inspire_bai or m.orcid or (m.lattes and m.lattes != "") %}
    <div class="member-links">
      {% if m.inspire_bai %}<a href="https://inspirehep.net/literature?q=a%20{{ m.inspire_bai }}">INSPIRE</a>{% endif %}
      {% if m.orcid %}<a href="https://orcid.org/{{ m.orcid }}">ORCID</a>{% endif %}
      {% if m.lattes and m.lattes != "" %}<a href="https://lattes.cnpq.br/{{ m.lattes }}">Lattes</a>{% endif %}
    </div>
    {% endif %}
  </div>
{% endfor %}
</div>

  {% endif %}
{% endfor %}

---

## Former Members

{% for group in site.data.members %}
  {% assign former_members = group.members | where: "active", false %}
  {% if former_members.size > 0 %}

### {{ group.role }}

{% for m in former_members %}
- {% if m.url %}[{{ m.name }}]({{ m.url }}){% else %}{{ m.name }}{% endif %}{% if m.note %} — {{ m.note }}{% endif %}{% if m.inspire_bai or m.orcid or (m.lattes and m.lattes != "") %} <span class="member-links-inline">({% if m.inspire_bai %}<a href="https://inspirehep.net/literature?q=a%20{{ m.inspire_bai }}">INSPIRE</a>{% endif %}{% if m.orcid %}{% if m.inspire_bai %} · {% endif %}<a href="https://orcid.org/{{ m.orcid }}">ORCID</a>{% endif %}{% if m.lattes and m.lattes != "" %}{% if m.inspire_bai or m.orcid %} · {% endif %}<a href="https://lattes.cnpq.br/{{ m.lattes }}">Lattes</a>{% endif %})</span>{% endif %}
{% endfor %}

  {% endif %}
{% endfor %}
