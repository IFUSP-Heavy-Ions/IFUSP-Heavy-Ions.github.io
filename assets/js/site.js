/* IFUSP Heavy-Ion Group — small progressive enhancements (no dependencies). */
(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !toggle.contains(e.target)) {
        setOpen(false);
      }
    });
  }

  /* ---------- Hero backdrop mode switcher (static vs animated) ---------- */
  var hero = document.querySelector(".hero[data-hero-mode]");
  var modeButtons = document.querySelectorAll("[data-set-hero-mode]");
  if (hero && modeButtons.length) {
    var applyHeroMode = function (mode) {
      hero.setAttribute("data-hero-mode", mode);
      Array.prototype.forEach.call(modeButtons, function (btn) {
        btn.setAttribute("aria-pressed", String(btn.getAttribute("data-set-hero-mode") === mode));
      });
      try { localStorage.setItem("ifusp-hero-mode", mode); } catch (e) {}
      window.dispatchEvent(new CustomEvent("ifusp:heromode", { detail: { mode: mode } }));
    };
    var savedMode = null;
    try { savedMode = localStorage.getItem("ifusp-hero-mode"); } catch (e) {}
    if (savedMode === "static" || savedMode === "animated") {
      applyHeroMode(savedMode);
    }
    Array.prototype.forEach.call(modeButtons, function (btn) {
      btn.addEventListener("click", function () {
        applyHeroMode(btn.getAttribute("data-set-hero-mode"));
      });
    });
  }

  /* ---------- Dropdown menu (listbox) ---------- */
  function setupMenu(root, onChange) {
    var button = root.querySelector("[data-menu-button]");
    var list = root.querySelector("[data-menu-list]");
    var label = root.querySelector("[data-menu-value]");
    var options = Array.prototype.slice.call(list.querySelectorAll("[role=option]"));
    var active = 0;
    var typed = "", typedTimer = 0;

    function isOpen() { return !list.hidden; }

    function setActive(i) {
      active = Math.max(0, Math.min(options.length - 1, i));
      options.forEach(function (o, idx) { o.classList.toggle("is-active", idx === active); });
      list.setAttribute("aria-activedescendant", options[active].id);
      var o = options[active];
      if (o.offsetTop < list.scrollTop) list.scrollTop = o.offsetTop;
      else if (o.offsetTop + o.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = o.offsetTop + o.offsetHeight - list.clientHeight;
      }
    }

    function selectedIndex() {
      for (var i = 0; i < options.length; i++) {
        if (options[i].getAttribute("aria-selected") === "true") return i;
      }
      return 0;
    }

    function open() {
      list.hidden = false;
      button.setAttribute("aria-expanded", "true");
      setActive(selectedIndex());
      list.focus({ preventScroll: true });
    }

    function close(focusButton) {
      list.hidden = true;
      button.setAttribute("aria-expanded", "false");
      if (focusButton) button.focus();
    }

    function setValue(value, notify) {
      var found = false;
      options.forEach(function (o) {
        var match = o.getAttribute("data-value") === value;
        o.setAttribute("aria-selected", String(match));
        if (match) {
          found = true;
          label.textContent = o.querySelector("span").textContent;
        }
      });
      if (!found) return setValue("", notify);
      root.classList.toggle("has-value", value !== "");
      if (notify) onChange(value);
      return value;
    }

    button.addEventListener("click", function () {
      if (isOpen()) close(true); else open();
    });
    button.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        open();
      }
    });

    options.forEach(function (o, idx) {
      o.addEventListener("click", function () {
        setValue(o.getAttribute("data-value"), true);
        close(true);
      });
      o.addEventListener("mousemove", function () { if (idx !== active) setActive(idx); });
    });

    list.addEventListener("keydown", function (e) {
      switch (e.key) {
        case "ArrowDown": e.preventDefault(); setActive(active + 1); break;
        case "ArrowUp": e.preventDefault(); setActive(active - 1); break;
        case "Home": e.preventDefault(); setActive(0); break;
        case "End": e.preventDefault(); setActive(options.length - 1); break;
        case "Enter":
        case " ":
          e.preventDefault();
          setValue(options[active].getAttribute("data-value"), true);
          close(true);
          break;
        case "Escape": e.preventDefault(); close(true); break;
        case "Tab": close(false); break;
        default:
          if (e.key.length === 1 && /\S/.test(e.key)) {
            clearTimeout(typedTimer);
            typed += e.key.toLowerCase();
            typedTimer = setTimeout(function () { typed = ""; }, 600);
            for (var i = 0; i < options.length; i++) {
              if (options[i].textContent.trim().toLowerCase().indexOf(typed) === 0) { setActive(i); break; }
            }
          }
      }
    });

    document.addEventListener("click", function (e) {
      if (isOpen() && !root.contains(e.target)) close(false);
    });

    return { set: setValue };
  }

  /* ---------- Filterable lists (presentations, publications) ---------- */
  function normalize(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function setupFilter(root) {
    var kind = root.getAttribute("data-filter");
    var list = document.querySelector("[data-filter-list]");
    if (!list) return;

    var itemSelector = kind === "talks" ? ".talk" : ".pub";
    var chipAttr = kind === "talks" ? "data-type" : "data-category";
    var chipParam = kind === "talks" ? "type" : "category";
    var noun = kind === "talks" ? "presentations" : "publications";

    var items = Array.prototype.slice.call(list.querySelectorAll(itemSelector));
    var groups = Array.prototype.slice.call(list.querySelectorAll("[data-filter-group]"));
    var search = root.querySelector("[data-filter-search]");
    var menuRoot = root.querySelector("[data-filter-menu]");
    var menuParam = menuRoot ? menuRoot.getAttribute("data-filter-menu") : null;
    var chips = Array.prototype.slice.call(root.querySelectorAll("[data-filter-chip]"));
    var status = root.querySelector("[data-filter-status]");
    var empty = document.querySelector("[data-filter-empty]");

    var texts = items.map(function (el) { return normalize(el.textContent); });
    var state = { q: "", chip: "", menu: "" };

    var menu = menuRoot ? setupMenu(menuRoot, function (value) { state.menu = value; apply(); }) : null;

    var params = new URLSearchParams(window.location.search);
    state.q = params.get("q") || "";
    state.chip = params.get(chipParam) || "";
    if (search) search.value = state.q;
    if (menu) state.menu = menu.set(params.get(menuParam) || "", false);

    function syncUrl() {
      var p = new URLSearchParams(window.location.search);
      [["q", state.q], [chipParam, state.chip], [menuParam, state.menu]].forEach(function (kv) {
        if (!kv[0]) return;
        if (kv[1]) p.set(kv[0], kv[1]); else p.delete(kv[0]);
      });
      var qs = p.toString();
      history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
    }

    function apply() {
      var terms = normalize(state.q).split(/\s+/).filter(Boolean);
      var shown = 0;
      items.forEach(function (el, idx) {
        var ok = (!state.chip || el.getAttribute(chipAttr) === state.chip) &&
          (!state.menu || el.getAttribute("data-speaker") === state.menu) &&
          terms.every(function (t) { return texts[idx].indexOf(t) !== -1; });
        el.hidden = !ok;
        if (ok) shown++;
      });
      groups.forEach(function (g) {
        g.hidden = !g.querySelector(itemSelector + ":not([hidden])");
      });
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", String(c.getAttribute("data-filter-chip") === state.chip));
      });
      var filtered = state.q || state.chip || state.menu;
      if (status) status.textContent = filtered ? "Showing " + shown + " of " + items.length + " " + noun + "." : "";
      if (empty) empty.hidden = shown !== 0;
      syncUrl();
    }

    if (search) {
      search.addEventListener("input", function () { state.q = search.value.trim(); apply(); });
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var value = c.getAttribute("data-filter-chip");
        state.chip = state.chip === value ? "" : value;
        apply();
      });
    });

    apply();
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-filter]"), setupFilter);
})();
