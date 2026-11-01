/* Visitor catalog: no tracking, third-party services, storage or write access. */
(async function () {
  "use strict";
  const root = document.querySelector("[data-library-list]");
  if (!root) return;
  const kind = root.dataset.libraryList;
  const loading = root.querySelector(".catalog-loading");
  if (loading) loading.hidden = false;
  const labels = {factsheet: "Factsheet", report: "Full report", publication: "Publication"};
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
    const permalink = link("Link to release", "#release-" + item.id, "release-permalink");
    permalink.setAttribute("aria-label", "Link to release: " + item.title);
    meta.append(permalink);
    article.append(meta, el("h3", item.title), el("p", item.summary),
      el("p", "By " + item.authors, "release-byline"));
    if (item.series && kind !== "series")
      article.append(link("Epidemiology Explained", "epidemiology-explained.html#release-" + item.id, "release-series"));
    for (const f of item.files) {
      const row = el("div", undefined, "release-file");
      const url = "library/" + encodeURIComponent(f.name);
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
    const res = await fetch("library/catalog.json", {cache:"no-cache", mode:"same-origin", credentials:"omit", signal:controller.signal});
    if (!res.ok) throw new Error("Catalog unavailable");
    const data = await res.json();
    if (PublicationCatalog.validate(data).length) throw new Error("Invalid catalog");
    const items = data.items.filter(item => kind === "series" ? item.series === "epidemiology-explained" :
      kind === "factsheets" ? item.type === "factsheet" : ["report","publication"].includes(item.type))
      .sort((a,b) => kind === "series" ? a.lesson.localeCompare(b.lesson, "en", {numeric:true}) :
        b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
    if (!items.length) {
      const copy = {
        factsheets:["No factsheets published yet", "When a factsheet is released, you’ll find its summary, available editions and downloads here."],
        series:["No lessons published yet", "The topic guide below introduces the series. Released lessons will appear here in lesson order."],
        reports:["No reports or publications listed yet", "This collection will list full reports and links to published research as they are released."]
      };
      root.replaceChildren(state(...copy[kind])); return;
    }
    const results = el("div", undefined, "release-results");
    root.replaceChildren();
    const controls = el("div", undefined, "release-filters");
    const search = el("input"); search.type = "search"; search.id = "release-search";
    const searchLabel = el("label","Search this collection"); searchLabel.htmlFor = search.id;
    const select = el("select"); select.id = "release-filter";
    const field = el("div"); field.append(searchLabel, search); controls.append(field);
    const filterField = el("div"), filterLabel = el("label", kind === "reports" ? "Type" : "Collection");
    filterLabel.htmlFor = select.id; filterField.append(filterLabel, select);
    const group = item => kind === "reports" ? labels[item.type] : item.series ? "Epidemiology Explained" : "Other factsheets";
    const groups = [...new Set(items.map(group))];
    select.append(new Option("All", ""));
    if (groups.length > 1) { groups.forEach(g => select.append(new Option(g, g))); controls.append(filterField); }
    const status = el("p", undefined, "release-count"); status.setAttribute("role","status");
    root.append(controls, status, results);
    function render() {
      const q = search.value.trim().toLocaleLowerCase();
      const found = items.filter(it => (!select.value || group(it) === select.value) &&
        [it.title,it.summary,it.authors,it.lesson,group(it)].filter(Boolean).join(" ").toLocaleLowerCase().includes(q));
      status.textContent = found.length + (found.length === 1 ? " release" : " releases");
      results.replaceChildren(...found.map(card));
      if (!found.length) {
        const msg = state("No matching releases","Try another title, author or lesson number.");
        const reset = el("button","Clear filters","button button-secondary"); reset.type = "button";
        reset.onclick = () => { search.value = ""; select.value = ""; render(); search.focus(); };
        msg.append(reset); results.append(msg);
      }
    }
    search.addEventListener("input", render); select.addEventListener("change", render);
    render();
    if (location.hash.startsWith("#release-")) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch {
    const msg = state("The release list couldn’t load","Please reload the page, or contact the institute for a copy of a publication.");
    msg.append(link("Contact the institute","contact.html","text-link")); root.replaceChildren(msg);
  } finally { clearTimeout(timeout); }
})();
