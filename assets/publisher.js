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

  function updateFields() {
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
    if (!/\.pdf$/i.test(file.name) || !(await file.slice(0, 1024).text()).includes("%PDF-"))
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
  form.addEventListener("reset", () => {
    invalidate();
    manualId = false;
    requestAnimationFrame(() => {
      updateFields();
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
      const updated = { ...base, items: [...base.items, entry] };
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
  updateFields();
  status.textContent = "";
})();
