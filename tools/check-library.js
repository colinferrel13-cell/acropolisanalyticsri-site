#!/usr/bin/env node
"use strict";

// Pre-release check. Nothing is uploaded, executed, or fetched from a publisher.
// This checks the release inventory, not scientific approval or PDF redaction.
const fs = require("node:fs");
const path = require("node:path");
const { validate } = require("../assets/library-schema.js");

function checkLibrary(dir = path.join(__dirname, "..", "library")) {
  const errors = [];
  try {
    if (!fs.lstatSync(dir).isDirectory()) return ["library/ must be a real directory."];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const byName = new Map(entries.map(entry => [entry.name, entry]));
    // An exact-name lookup matters even on Windows and macOS: Pages URLs are case-sensitive.
    if (!byName.get("catalog.json")?.isFile()) return ["Missing regular file library/catalog.json."];
    let catalog;
    try {
      catalog = JSON.parse(fs.readFileSync(path.join(dir, "catalog.json"), "utf8"));
    } catch (err) {
      return ["Cannot read library/catalog.json: " + err.message];
    }
    const schemaErrors = validate(catalog);
    // Never resolve paths supplied by records until the shared basename/URL contract passes.
    if (schemaErrors.length) return schemaErrors;

    const listed = new Set();
    for (const item of catalog.items) {
      for (const file of item.files) {
        listed.add(file.name);
        const tag = item.id + ": " + JSON.stringify(file.name);
        if (!byName.get(file.name)?.isFile()) {
          errors.push(tag + " is missing, is not a regular file, or does not match filename case.");
          continue;
        }
        const fullPath = path.join(dir, file.name);
        const actualBytes = fs.statSync(fullPath).size;
        if (actualBytes !== file.bytes)
          errors.push(tag + " has " + actualBytes + " bytes; catalog says " + file.bytes + ".");
        // Read only the PDF header, not potentially large publications into memory.
        const fd = fs.openSync(fullPath, "r");
        try {
          const head = Buffer.alloc(10);
          const n = fs.readSync(fd, head, 0, head.length, 0);
          if (!/^%PDF-(?:1\.[0-7]|2\.0)(?:\r\n|\r|\n)/.test(head.subarray(0, n).toString("latin1")))
            errors.push(tag + " lacks a valid PDF version header.");
        } finally { fs.closeSync(fd); }
      }
    }

    for (const entry of entries) {
      if (entry.name === "catalog.json") continue;
      if (!entry.isFile()) {
        errors.push("Unexpected directory, link, or special file in library/: " + JSON.stringify(entry.name) +
          ". Keep publications as regular files directly in library/.");
      } else if (!listed.has(entry.name)) {
        errors.push("Unlisted file in library/: " + JSON.stringify(entry.name) +
          ". Add an approved release to the catalog or keep the file out of the public repository.");
      }
    }
  } catch (err) {
    errors.push("Cannot validate publication library: " + err.message);
  }
  return errors;
}

if (require.main === module) {
  const errors = checkLibrary();
  if (errors.length) {
    for (const message of errors) console.error(message);
    process.exitCode = 1;
  } else {
    console.log("Publication catalog and release files match.");
  }
}

module.exports = { checkLibrary };
