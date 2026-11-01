/* A local release packager. No repository requests, credentials, or writes. */
(() => {
  "use strict";
  const el = (id) => document.getElementById(id);
  const form = el("publication-form");
  const status = el("preparation-status");
  const packageBox = el("package-result");
  const filesList = el("package-files");
  const schema = window.PublicationCatalog;
  if (!schema || typeof schema.validate !== "function") {
    status.textContent = "The release validator did not load. Refresh this page or use the repository publishing instructions.";
    return;
  }

  let revision = 0;
  let manualId = false;
  let exportedUrls = [];
  const value = (id) => el(id).value.trim();
  const selected = (id) => el(id).files[0];
  const checked = id => [...el(id).querySelectorAll("input:checked")].map(i => i.value);
  function choices(id, pairs, keep = []) {
    const container = el(id); container.replaceChildren();
    for (const [value, title] of pairs) {
      const label = document.createElement("label"); label.className = "check-label";
      const input = document.createElement("input"); input.type = "checkbox";
      input.value = value; input.checked = keep.includes(value);
      label.append(input, document.createTextNode(title)); container.append(label);
    }
  }
  for (const [id,name] of Object.entries(schema.topics)) el("entry-topic").add(new Option(name,id));
  choices("entry-extra-topics", Object.entries(schema.topics));
  choices("entry-collections", Object.entries(schema.collections));
  choices("entry-services", Object.entries(schema.services));
  for (const [id,name] of Object.entries(schema.projects)) el("entry-project").add(new Option(name,id));
  fetch("./surveys/registry.json",{mode:"same-origin",credentials:"omit",cache:"no-cache"})
    .then(async r => {
      if (!r.ok) throw Error();
      const registry = await r.json();
      if (registry.version !== 1 || !Array.isArray(registry.studies)) throw Error();
      for (const study of registry.studies)
        if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(study.id) && typeof study.title === "string")
          el("entry-study").add(new Option(study.title, study.id));
    }).catch(() => { el("study-choices-status").textContent = "Study options could not load. If sharing study findings, reconnect before preparing your release."; });

  let choicesVersion = 0;
  async function refreshRelations() {
    const current = ++choicesVersion;
    const prior = checked("entry-related"), earlier = el("entry-supersedes");
    const previous = earlier.value;
    choices("entry-related", []); earlier.replaceChildren(new Option("None",""));
    try {
      const catalog = await loadBase();
      if (current !== choicesVersion) return;
      choices("entry-related", catalog.items.map(it => [it.id,it.title]), prior);
      for (const it of catalog.items) earlier.add(new Option(it.title,it.id));
      if ([...earlier.options].some(o => o.value === previous)) earlier.value = previous;
      el("related-status").textContent = catalog.items.length ? "" : "No prior releases are available in the starting catalog.";
    } catch {
      if (current === choicesVersion) el("related-status").textContent = "Choose a current local catalog below to see companion releases.";
    }
  }
  const slug = (str) => str.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
    .slice(0, 90).replace(/^-+|-+$/g, "");

  function invalidate() {
    revision++;
    exportedUrls.forEach((url) => URL.revokeObjectURL(url));
    exportedUrls = [];
    filesList.replaceChildren();
    packageBox.hidden = true;
    el("github-upload").hidden = true;
    el("github-upload").removeAttribute("href");
    el("upload-branch").value = "";
    status.textContent = "";
  }

  let lastGroupKeys = "";
  function updateGroupCodes() {
    const ids = [...new Set([value("entry-topic"), ...checked("entry-extra-topics"), ...checked("entry-collections")])]
      .filter(id => Object.hasOwn(schema.groups, id));
    if (lastGroupKeys === ids.join(",")) return;
    lastGroupKeys = ids.join(",");
    const rows=ids.map(id=>{
      const row=document.createElement("li"), group=document.createElement("a");
      group.textContent=schema.groups[id].label; group.href=schema.groupURL(id);
      group.target="_blank"; group.rel="noopener"; group.setAttribute("aria-label", group.textContent+" (opens in a new tab)");
      row.append(group);
      for (const ext of ["svg","png"]) {
        const save=document.createElement("a"); save.textContent=ext.toUpperCase();
        save.href="/assets/qr/"+id+"."+ext; save.download=id+"."+ext;
        save.setAttribute("aria-label","Download "+schema.groups[id].label+" QR code ("+ext.toUpperCase()+")");
        row.append(" · ",save);
      }
      return row;
    });
    el("group-code-links").replaceChildren(...rows); el("selected-group-codes").hidden=!rows.length;
  }
  function updateFields() {
    el("entry-topic").required = !checked("entry-collections").length || checked("entry-extra-topics").length > 0;
    updateGroupCodes();
    const factsheet = value("entry-type") === "factsheet";
    const inSeries = factsheet && el("entry-series").checked;
    el("series-options").hidden = !factsheet;
    el("entry-series").disabled = !factsheet;
    el("lesson-field").hidden = !inSeries;
    el("lesson-hint").hidden = !inSeries;
    el("entry-lesson").disabled = !inSeries;
    el("entry-lesson").required = inSeries;
    el("entry-file").required = value("entry-type") !== "publication";
  }

  function validate(data, label) {
    const errors = schema.validate(data);
    if (errors.length) throw new Error(label + ":\n" + errors.join("\n"));
  }

  async function loadBase() {
    const source = selected("entry-catalog");
    let raw;
    if (source) {
      raw = await source.text();
    } else {
      let response;
      try {
        response = await fetch("./library/catalog.json", {
          cache: "no-store", mode: "same-origin", credentials: "omit"
        });
        if (!response.ok) throw new Error("Catalog unavailable");
        raw = await response.text();
      } catch {
        throw new Error("Could not read the website catalog. Open this tool over HTTP or choose the current library/catalog.json under “Working offline or from a newer branch?” No files have been published.");
      }
    }
    let base;
    try { base = JSON.parse(raw.replace(/^\uFEFF/, "")); }
    catch { throw new Error("The selected catalog is not readable JSON. Choose a current library/catalog.json, not a PDF or GitHub webpage."); }
    validate(base, "The starting catalog is not valid");
    return base;
  }

  async function preparePdf(file, label, id) {
    if (file.size <= 0 || file.size > 25 * 1024 * 1024)
      throw new Error("Choose a nonempty PDF of 25 MiB or less for each edition.");
    if (!/\.pdf$/i.test(file.name) || !/^%PDF-(?:1\.[0-7]|2\.0)(?:\r\n|\r|\n)/.test(await file.slice(0, 10).text()))
      throw new Error("A selected file does not appear to be a PDF. Export it as a real PDF rather than renaming its extension.");
    const suffix = { "PDF": "", "Showcase": "-showcase", "Printer-friendly": "-print" }[label];
    if (suffix === undefined) throw new Error("Choose a supported PDF edition.");
    return { file, meta: { name: id + suffix + ".pdf", label, bytes: file.size } };
  }

  function offerFile(blob, name) {
    const href = URL.createObjectURL(blob);
    exportedUrls.push(href);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = name;
    anchor.textContent = "Save " + name;
    const row = document.createElement("li");
    row.append(anchor);
    filesList.append(row);
  }

  form.addEventListener("input", (event) => {
    invalidate();
    if (event.target.id === "entry-id") manualId = Boolean(value("entry-id"));
    if (event.target.id === "entry-title" && !manualId)
      el("entry-id").value = slug(value("entry-title"));
    updateFields();
  });
  form.addEventListener("change", () => { invalidate(); updateFields(); });
  el("entry-catalog").addEventListener("change", refreshRelations);
  form.addEventListener("reset", () => {
    invalidate();
    manualId = false;
    requestAnimationFrame(() => {
      updateFields();
      refreshRelations();
      status.textContent = "Form cleared. No repository changes were made.";
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    invalidate();
    const currentRevision = revision;
    updateFields();
    if (!form.reportValidity()) return;
    el("prepare-release").disabled = true;
    status.textContent = "Checking the starting catalog and the selected files…";
    try {
      const id = value("entry-id"), type = value("entry-type");
      const entry = {
        id, type, title: value("entry-title"), summary: value("entry-summary"),
        date: value("entry-date"), authors: value("entry-authors"), files: []
      };
      const topics = [...new Set([value("entry-topic"), ...checked("entry-extra-topics")].filter(Boolean))];
      if (topics.length) entry.topics = topics;
      for (const [key, field] of Object.entries({takeaway:"takeaway", geography:"geography",dataPeriod:"data-period",
        citation:"citation", version:"version", revision:"revision", supersedes:"supersedes", project:"project", study:"study"})) {
        const text = value("entry-" + field); if (text) entry[key] = text;
      }
      for (const key of ["related","services","collections"]) {
        const list = checked("entry-" + key); if (list.length) entry[key] = list;
      }
      if (el("entry-featured").checked) entry.featured = true;
      const url = value("entry-url");
      if (url) entry.url = url;
      if (type === "factsheet" && el("entry-series").checked) {
        entry.series = "epidemiology-explained";
        entry.lesson = value("entry-lesson");
      }
      const first = selected("entry-file"), second = selected("entry-print");
      const label = value("entry-edition");
      if (!first && second) throw new Error("Put the only PDF in the first PDF field, then select its edition.");
      if (second && label !== "Showcase") throw new Error("For two editions, choose Showcase for the first PDF and put its printer-friendly edition in the second field.");
      if (first && second && first.name === second.name && first.size === second.size && first.lastModified === second.lastModified)
        throw new Error("Both editions appear to use the same file. Select the distinct printer-friendly edition or omit it.");
      const base = await loadBase();
      const files = [];
      if (first) files.push(await preparePdf(first, label, id));
      if (second) files.push(await preparePdf(second, "Printer-friendly", id));
      entry.files = files.map((pdf) => pdf.meta);
      const retained = base.items.map(it => {
        if (!entry.featured || !it.featured) return it;
        const copy = {...it}; delete copy.featured; return copy;
      });
      const updated = { ...base, items: [...retained, entry] };
      validate(updated, "Cannot prepare this release");
      if (revision !== currentRevision) return;

      // The publication file bytes flow only to local blob download URLs.
      files.forEach(({ file, meta }) => offerFile(file, meta.name));
      offerFile(new Blob([JSON.stringify(updated, null, 2) + "\n"], {type: "application/json"}), "catalog.json");
      el("package-summary").textContent =
        '“' + entry.title + '” · ' + entry.date + ' · ' + entry.authors +
        ". The new catalog retains " + base.items.length + " existing " +
        (base.items.length === 1 ? "entry" : "entries") + " and adds this one.";
      packageBox.hidden = false;
      packageBox.focus();
      status.textContent = "Release files are ready to save. Nothing has been uploaded.";
      el("branch-status").textContent = "";
    } catch (error) {
      if (revision !== currentRevision) return;
      status.textContent = "No release prepared. " + (error.message || "Check the inputs and try again.");
    } finally {
      el("prepare-release").disabled = false;
    }
  });

  el("upload-branch").addEventListener("input", () => {
    const branch = value("upload-branch");
    const valid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(branch)
      && !/^(main|master|head|gh-pages)$/i.test(branch);
    const anchor = el("github-upload");
    anchor.hidden = !valid || packageBox.hidden;
    if (valid && !packageBox.hidden) {
      anchor.href = "https://github.com/colinferrel13-cell/acropolisanalyticsri-site/upload/" + encodeURIComponent(branch) + "/library";
      el("branch-status").textContent = "Destination: " + branch + " / library";
    } else {
      anchor.removeAttribute("href");
      el("branch-status").textContent = branch ? "Use the name of a review branch, not main or another publishing branch." : "";
    }
  });
  el("entry-fields").disabled = false;
  refreshRelations();
  updateFields();
  status.textContent = "";
})();
