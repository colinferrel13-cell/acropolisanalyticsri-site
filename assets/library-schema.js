/* One release contract shared by the reader, editor and pull-request checks. */
(function (root) {
  "use strict";
  const obj = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const clean = v => typeof v === "string" && v.length > 0 && v === v.trim();
  const validDate = v => {
    if (!clean(v) || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const parsed = new Date(v + "T00:00:00Z");
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v;
  };
  function validURL(v) {
    if (!clean(v) || !/^https:\/\//i.test(v)) return false;
    try {
      const u = new URL(v);
      return Boolean(u.hostname && u.protocol === "https:" && !u.username && !u.password);
    } catch { return false; }
  }
  function validate(catalog) {
    if (!obj(catalog) || catalog.version !== 1 || !Array.isArray(catalog.items))
      return ["Expected catalog version 1 with an items list."];
    const ids = new Set(), lessons = new Set(), paths = new Set(), errors = [];
    for (const [i, item] of catalog.items.entries()) {
      const err = msg => errors.push("Entry " + (i + 1) + ": " + msg);
      if (!obj(item)) { err("expected an object."); continue; }
      if (!clean(item.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || ids.has(item.id))
        err("use a unique lowercase, hyphenated ID.");
      ids.add(item.id);
      if (!["factsheet", "report", "publication"].includes(item.type)) err("unknown item type.");
      for (const key of ["title", "summary", "authors"]) if (!clean(item[key])) err("supply " + key + ".");
      if (!validDate(item.date)) err("supply a valid release date (YYYY-MM-DD).");
      if (item.series || item.lesson) {
        if (item.type !== "factsheet" || item.series !== "epidemiology-explained" ||
          !clean(item.lesson) || !/^EE (0|[1-9]\d*)\.\d{2}$/.test(item.lesson) || lessons.has(item.lesson))
          err("use a unique EE lesson such as EE 0.00, on a series factsheet only.");
        lessons.add(item.lesson);
      }
      if (item.url && !validURL(item.url)) err("use an https publication link without credentials.");
      if (!Array.isArray(item.files)) { err("files must be a list."); continue; }
      if (!item.files.length && !(item.type === "publication" && validURL(item.url)))
        err("supply a PDF, or a publisher link for an external publication.");
      const labels = new Set();
      for (const f of item.files) {
        if (!obj(f)) { err("invalid file."); continue; }
        if (!clean(f.name) || !/^[a-z0-9][a-z0-9._-]*\.pdf$/i.test(f.name) ||
            paths.has(String(f.name).toLowerCase())) err("use a unique PDF basename (no spaces or folders).");
        paths.add(String(f.name).toLowerCase());
        if (!["Showcase", "Printer-friendly", "PDF"].includes(f.label) || labels.has(f.label))
          err("use a distinct supported edition for each file.");
        labels.add(f.label);
        if (!Number.isSafeInteger(f.bytes) || f.bytes < 1) err("file size must be in bytes.");
      }
    }
    return errors;
  }
  const api = { validate };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PublicationCatalog = api;
})(globalThis);
