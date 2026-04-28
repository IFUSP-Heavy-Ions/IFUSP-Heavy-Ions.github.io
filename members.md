---
layout: page
title: Members
permalink: /members/
---

This page is rendered from `/_data/members.yml`.
Set `active: false` for a member to move them to the Former Members section automatically.

## Current Members

{% for group in site.data.members %}
  {% assign active_members = group.members | where: "active", true %}
  {% if active_members.size > 0 %}

### {{ group.role }}

{% for m in active_members %}
- {% if m.url %}[{{ m.name }}]({{ m.url }}){% else %}{{ m.name }}{% endif %}{% if m.title %} — {{ m.title }}{% endif %}
  {%- if m.inspire_bai or m.orcid or m.lattes %}
  <br>
  {% if m.inspire_bai %}<a href="https://inspirehep.net/search?p=a+{{ m.inspire_bai }}&of=hb">INSPIRE</a>{% endif %}{% if m.orcid %}{% if m.inspire_bai %} · {% endif %}<a href="https://orcid.org/{{ m.orcid }}">ORCID</a>{% endif %}{% if m.lattes and m.lattes != "" %}{% if m.inspire_bai or m.orcid %} · {% endif %}<a href="http://lattes.cnpq.br/{{ m.lattes }}">Lattes</a>{% endif %}
  {% endif %}
{% endfor %}

  {% endif %}
{% endfor %}

---

## Former Members

{% for group in site.data.members %}
  {% assign former_members = group.members | where: "active", false %}
  {% if former_members.size > 0 %}

### {{ group.role }}

{% for m in former_members %}
- {% if m.url %}[{{ m.name }}]({{ m.url }}){% else %}{{ m.name }}{% endif %}{% if m.note %} — {{ m.note }}{% endif %}
{% endfor %}

  {% endif %}
{% endfor %}

---

_To update this list, edit [`/_data/members.yml`](https://github.com/IFUSP-Heavy-Ions/IFUSP-Heavy-Ions.github.io/blob/main/_data/members.yml) and open a pull request._
