/* Visitor catalog: no tracking, third-party services, storage or write access. */
(async function () {
  "use strict";
  const root = document.querySelector("[data-library-list]");
  if (!root) return;
  const kind = root.dataset.libraryList;
  const loading = root.querySelector(".catalog-loading");
  if (loading) loading.hidden = false;
  const api = window.PublicationCatalog;
  const labels = api ? api.types : {};
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  function link(text, href, cls) {
    const a = el("a", text, cls); a.href = href; return a;
  }
  function state(title, desc) {
    const panel = el("div", undefined, "library-notice");
    panel.append(el("h3", title), el("p", desc));
    return panel;
  }
  const bytesLabel = n => n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1048576).toFixed(1) + " MB";
  function card(item) {
    const article = el("article", undefined, "release-entry");
    article.id = "release-" + item.id;
    const meta = el("div", undefined, "release-meta");
    const date = el("time", new Date(item.date + "T00:00:00Z").toLocaleDateString("en-US",
      {year:"numeric", month:"short", day:"numeric", timeZone:"UTC"}));
    date.dateTime = item.date;
    meta.append(el("span", item.lesson || labels[item.type]), date);
    const heading = el("h3");
    heading.append(link(item.title, api.releaseURL(item.id)));
    article.append(meta, heading, el("p", item.summary),
      el("p", "By " + item.authors, "release-byline"));
    if (item.topics?.length || item.collections?.length) {
      const tags = el("div", undefined, "release-topics");
      (item.topics || []).forEach(id => tags.append(link(api.topics[id], api.topicURL(id))));
      (item.collections || []).forEach(id => tags.append(link(api.collections[id], api.groupURL(id))));
      article.append(tags);
    }
    if (item.series && kind !== "series")
      article.append(link("Epidemiology Explained", "/epidemiology-explained.html#release-" + item.id, "release-series"));
    for (const f of item.files) {
      const row = el("div", undefined, "release-file");
      const url = "/library/" + encodeURIComponent(f.name);
      const info = el("span", (f.label === "PDF" ? "PDF" : f.label + " PDF") + " · " + bytesLabel(f.bytes));
      const open = link("View PDF", url);
      const download = link("Download PDF", url);
      download.download = f.name;
      open.setAttribute("aria-label", "View " + item.title + " (" + f.label + ")");
      download.setAttribute("aria-label", "Download " + item.title + " (" + f.label + ")");
      row.append(info, open, download); article.append(row);
    }
    if (item.url) article.append(link("Read at the publisher ↗", item.url, "release-external"));
    return article;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch("/library/catalog.json", {cache:"no-cache", mode:"same-origin", credentials:"omit", signal:controller.signal});
    if (!res.ok) throw new Error("Catalog unavailable");
    const data = await res.json();
    if (api.validate(data).length) throw new Error("Invalid catalog");
    const groupId = root.dataset.group;
    const group = kind === "group" && Object.hasOwn(api.groups, groupId) ? api.groups[groupId] : null;
    if (kind === "group" && !group) throw new Error("Unknown library group");
    // The permanent path sets the scope. Search, reset and shared filter URLs cannot expand it.
    const items = data.items.filter(item => group ? (group.kind === "topic" ? item.topics : item.collections)?.includes(groupId) :
      kind === "all" ? true : kind === "series" ? item.series === "epidemiology-explained" :
      kind === "factsheets" ? item.type === "factsheet" : ["report","publication"].includes(item.type))
      .sort((a,b) => kind === "series" ? a.lesson.localeCompare(b.lesson, "en", {numeric:true}) :
        b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
    if (!items.length) {
      const copy = {
        all:["No public releases yet", "Reviewed factsheets, reports and publications will appear here together as they are released."],
        group:["No releases here yet", "No approved resources have been published in this group. Use this same address to check for future releases."],
        factsheets:["No factsheets published yet", "When a factsheet is released, you’ll find its summary, available editions and downloads here."],
        series:["No lessons published yet", "The topic guide below introduces the series. Released lessons will appear here in lesson order."],
        reports:["No reports or publications listed yet", "This collection will list full reports and links to published research as they are released."]
      };
      root.replaceChildren(state(...copy[kind])); return;
    }
    const results = el("div", undefined, "release-results");
    root.replaceChildren();
    const topicIds = [...new Set(items.flatMap(item => item.topics || []))]
      .sort((a,b) => api.topics[a].localeCompare(api.topics[b]));
    const collectionIds = [...new Set(items.flatMap(item => item.collections || []))]
      .sort((a,b) => api.collections[a].localeCompare(api.collections[b]));
    const entryParams = new URL(location.href).searchParams;
    // Preserve a reader's saved filter even if a topic later ceases to have releases.
    const controls = el("div", undefined, "release-filters");
    const search = el("input"); search.type = "search"; search.id = "release-search";
    search.value = entryParams.get("q") || "";
    function field(name, control) {
      const wrap = el("div"), label = el("label", name); label.htmlFor = control.id;
      wrap.append(label, control); controls.append(wrap);
    }
    field(kind === "all" ? "Search the whole library" : "Search this collection", search);
    function selectField(key, name, options, allLabel, locked = false) {
      const s = el("select"); s.id = "release-" + key;
      s.append(new Option(allLabel, ""));
      if (locked) return s;
      options.forEach(([id,label]) => s.append(new Option(label,id)));
      const requested = entryParams.get(key);
      if (requested && !options.some(([v]) => v === requested)) s.append(new Option("Unavailable selection", requested));
      s.value = requested || "";
      if (options.length || requested) field(name, s);
      return s;
    }
    const topic = selectField("topic","Topic", topicIds.map(id => [id,api.topics[id]]), "All topics", group?.kind === "topic");
    const collection = selectField("collection","Collection", collectionIds.map(id => [id,api.collections[id]]), "All collections", group?.kind === "collection");
    const type = selectField("type","Resource type", kind === "all" || kind === "reports" || kind === "group"
      ? [...new Set(items.map(it => it.type))].map(id => [id,labels[id]]) : [], "All types");
    const series = selectField("series","Series", (kind === "all" || kind === "factsheets" || kind === "group") && items.some(it => it.series)
      ? [["epidemiology-explained","Epidemiology Explained"]] : [], "All series");
    if (kind === "all" && topicIds.length) {
      const nav = el("nav",undefined,"topic-index"); nav.setAttribute("aria-label","Browse by topic");
      topicIds.forEach(id => {
        const a = link(api.topics[id], api.topicURL(id)); a.dataset.topicId=id;
        if (id === topic.value) a.setAttribute("aria-current","true");
        nav.append(a);
      });
      root.append(nav);
    }
    const status = el("p", undefined, "release-count"); status.setAttribute("role","status");
    root.append(controls, status, results);
    function render(updateURL = false) {
      const q = search.value.trim().toLowerCase(), tokens = q.split(/\s+/).filter(Boolean);
      if (updateURL) {
        const u = new URL(location.href);
        for (const [key,value] of [["q",q],["topic",topic.value],["collection",collection.value],["type",type.value],["series",series.value]])
          if (value) u.searchParams.set(key, value); else u.searchParams.delete(key);
        if (u.hash.startsWith("#release-")) u.hash = "";
        history.replaceState(null,"",u);
      }
      root.querySelectorAll(".topic-index a").forEach(a => {
        if (a.dataset.topicId === topic.value) a.setAttribute("aria-current","true");
        else a.removeAttribute("aria-current");
      });
      if (kind === "all") {
        const subject = topicIds.includes(topic.value) ? api.topics[topic.value] : "";
        document.getElementById("browse-title").textContent = subject || "Browse by topic";
        document.title = (subject ? subject + " · " : "") + "Research Library | Acropolis Analytics Research Institute";
      }
      const found = items.filter(it => (!topic.value || it.topics?.includes(topic.value)) &&
        (!collection.value || it.collections?.includes(collection.value)) &&
        (!type.value || it.type === type.value) && (!series.value || it.series === series.value) &&
        tokens.every(token => api.searchText(it).includes(token)));
      status.textContent = found.length + (found.length === 1 ? " release" : " releases");
      results.replaceChildren(...found.map(card));
      if (!found.length) {
        const msg = state("No matching releases","Try another title, author or lesson number.");
        const reset = el("button","Clear filters","button button-secondary"); reset.type = "button";
        reset.onclick = () => { for (const control of [search, topic, collection, type, series]) control.value = ""; render(true); search.focus(); };
        msg.append(reset); results.append(msg);
      }
    }
    search.addEventListener("input", () => render(true));
    [topic,collection,type,series].forEach(control => control.addEventListener("change", () => render(true)));
    render();
    if (location.hash.startsWith("#release-")) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch {
    const msg = state("The release list couldn’t load","Please reload the page, or contact the institute for a copy of a publication.");
    msg.append(link("Contact the institute","/contact.html","text-link")); root.replaceChildren(msg);
  } finally { clearTimeout(timeout); }
})();
