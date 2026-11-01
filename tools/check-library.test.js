"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { validate, searchText, releaseURL, topicURL } = require("../assets/library-schema.js");
const { checkLibrary } = require("./check-library.js");

// These synthetic metadata and header bytes are created only in isolated OS temp
// folders. They are not releases or contents of the site's public catalog.
const payload = Buffer.from("%PDF-1.7\n% inventory-check fixture, not a publication\n%%EOF\n");
const catalog = (...items) => ({ version: 1, items });
const file = (name, label = "PDF") => ({ name, label, bytes: payload.length });
const release = (extra = {}) => ({
  id: "example-report", type: "report", title: "Test release", summary: "Test only.",
  authors: "Fixture author", date: "2024-02-29", files: [file("example-report.pdf")], ...extra
});
const lesson = () => release({
  id: "example-lesson", type: "factsheet", series: "epidemiology-explained", lesson: "EE 2.11",
  files: [file("example-lesson-screen.pdf", "Showcase"), file("example-lesson-print.pdf", "Printer-friendly")]
});
const publication = () => release({
  id: "example-paper", type: "publication", url: "https://journal.example/article", files: []
});

function fixture(t, data, files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "acropolis-release-check-"));
  const madeFiles = [];
  const madeDirs = [];
  t.after(() => {
    // Remove only the exact files and empty directories created by this test.
    for (const name of madeFiles.reverse()) fs.unlinkSync(name);
    for (const name of madeDirs.reverse()) fs.rmdirSync(name);
    fs.rmdirSync(dir);
  });
  function write(name, content) {
    const fullPath = path.join(dir, name);
    if (!fs.existsSync(fullPath)) madeFiles.push(fullPath);
    fs.writeFileSync(fullPath, content);
  }
  function mkdir(name) {
    const fullPath = path.join(dir, name);
    fs.mkdirSync(fullPath);
    madeDirs.push(fullPath);
  }
  function symlink(name, target) {
    const fullPath = path.join(dir, name);
    fs.symlinkSync(target, fullPath, "file");
    madeFiles.push(fullPath);
  }
  write("catalog.json", JSON.stringify(data));
  for (const [name, content] of Object.entries(files)) write(name, content);
  return { dir, write, mkdir, symlink };
}

test("the real site catalog matches the public release folder", () => {
  // Empty now or populated later: no assumption about the number of releases.
  assert.deepEqual(checkLibrary(), []);
});

test("an empty catalog is publishable", t => {
  assert.deepEqual(checkLibrary(fixture(t, catalog()).dir), []);
});

test("one tagged report is discoverable by common terminology and links to its methods lesson", () => {
  const record = release({topics:["cardiovascular-disease"], related:["example-lesson"],
    featured:true, services:["mapping","reporting"], project:"paeon",
    geography:"Rhode Island", dataPeriod:"2018–2022", takeaway:"Fixture only.",
    citation:"Example citation.", version:"1.1", revision:"Updated figure."});
  assert.deepEqual(validate(catalog(record,lesson())), []);
  assert.match(searchText(record), /heart disease/);
  assert.match(searchText(record), /rhode island/);
  assert.equal(releaseURL(record.id),"/release.html?id=example-report");
  assert.equal(topicURL(record.topics[0]),"/topics/cardiovascular-disease/");
});

test("the file checker resolves study links against the public registry", t => {
  const {dir} = fixture(t, catalog({...publication(),study:"not-a-registered-study"}));
  assert.match(checkLibrary(dir).join(" "),/study is not present/);
});

test("dual-edition EE sheet, full report and publisher-only publication", t => {
  const data = catalog(lesson(), release(), publication());
  const files = Object.fromEntries(data.items.flatMap(item => item.files.map(f => [f.name, payload])));
  assert.deepEqual(validate(data), []);
  assert.deepEqual(checkLibrary(fixture(t, data, files).dir), []);
});

for (const [label, data] of [
  ["unsupported catalog version", { version: 2, items: [] }],
  ["unknown topic", catalog(release({topics:["not-a-real-topic"]}))],
  ["duplicate topic", catalog(release({topics:["cardiovascular-disease","cardiovascular-disease"]}))],
  ["topic is not an array", catalog(release({topics:"cardiovascular-disease"}))],
  ["unknown project", catalog(release({project:"not-a-project"}))],
  ["unsafe study ID", catalog(release({study:"../not-a-study"}))],
  ["unknown service", catalog(release({services:["unrecognized"]}))],
  ["unknown related release", catalog(release({related:["unreleased-draft"]}))],
  ["self-related release", catalog(release({related:["example-report"]}))],
  ["unknown earlier version", catalog(release({supersedes:"does-not-exist"}))],
  ["cyclic revision", catalog(release({supersedes:"example-paper"}), {...publication(),supersedes:"example-report"})],
  ["two featured findings", catalog(release({featured:true}), {...publication(),featured:true})],
  ["blank takeaway", catalog(release({takeaway:" "}))],
  ["invalid date", catalog(release({ date: "2025-02-29" }))],
  ["unrecognized type", catalog(release({ type: "survey" }))],
  ["invalid release ID", catalog(release({ id: "Report One" }))],
  ["duplicate ID", catalog(publication(), publication())],
  ["missing author", catalog(release({ authors: " " }))],
  ["invalid EE ID", catalog({ ...lesson(), lesson: "EE 2.1" })],
  ["duplicate lesson ID", catalog(lesson(), { ...lesson(), id: "another", files: [file("another.pdf")] })],
  ["EE series on a report", catalog({ ...lesson(), type: "report" })],
  ["link-only report", catalog(release({ files: [], url: "https://example.org" }))],
  ["no file or publication URL", catalog(release({ type: "publication", files: [] }))],
  ["unsafe protocol", catalog({ ...publication(), url: "javascript:alert(1)" })],
  ["HTTP publisher URL", catalog({ ...publication(), url: "http://journal.example" })],
  ["publisher URL credentials", catalog({ ...publication(), url: "https://name:pass@journal.example" })],
  ["relative URL", catalog({ ...publication(), url: "//journal.example" })],
  ["path traversal", catalog(release({ files: [file("../draft.pdf")] }))],
  ["encoded slash", catalog(release({ files: [file("outside%2fdraft.pdf")] }))],
  ["Windows path separator", catalog(release({ files: [file("outside\\draft.pdf")] }))],
  ["not a PDF basename", catalog(release({ files: [file("document.html")] }))],
  ["duplicate filename ignoring case", catalog(lesson(), release({ files: [file("EXAMPLE-LESSON-SCREEN.PDF")] }))],
  ["duplicate file edition", catalog(release({ files: [file("one.pdf"), file("two.pdf")] }))],
  ["unknown edition", catalog(release({ files: [file("draft.pdf", "Draft")] }))],
  ["invalid byte size", catalog(release({ files: [{ ...file("one.pdf"), bytes: -1 }] }))],
]) {
  test("rejects " + label, () => assert.notEqual(validate(data).length, 0));
}

test("missing file or different letter case fails even on case-insensitive systems", t => {
  const { dir, write } = fixture(t, catalog(release()));
  assert.match(checkLibrary(dir).join("\n"), /missing/);
  write("Example-Report.pdf", payload);
  const errors = checkLibrary(dir).join("\n");
  assert.match(errors, /filename case/);
  assert.match(errors, /Unlisted/);
});

test("a renamed text file with matching size is not a PDF", t => {
  const { dir } = fixture(t, catalog(release()), { "example-report.pdf": Buffer.alloc(payload.length, 65) });
  assert.match(checkLibrary(dir).join("\n"), /PDF version header/);
});

test("the size must match exactly", t => {
  const { dir } = fixture(t, catalog(release()), { "example-report.pdf": Buffer.concat([payload, Buffer.from("X")]) });
  assert.match(checkLibrary(dir).join("\n"), /catalog says/);
});

test("unlisted documents and nested folders cannot silently become public", t => {
  const { dir, mkdir, write } = fixture(t, catalog(), { "not-reviewed.pdf": payload, "draft-notes.txt": "private" });
  mkdir("subfolder");
  write("subfolder/nested-draft.PDF", payload);
  const errors = checkLibrary(dir).join("\n");
  assert.match(errors, /not-reviewed\.pdf/);
  assert.match(errors, /draft-notes\.txt/);
  assert.match(errors, /Unexpected directory.*subfolder/);
});

test("file symlinks cannot substitute for an approved PDF", t => {
  const { dir, symlink } = fixture(t, catalog(release()), { "target.pdf": payload });
  try { symlink("example-report.pdf", "target.pdf"); }
  catch (err) {
    if (err.code === "EPERM" || err.code === "EACCES") return t.skip("OS does not permit test symlinks.");
    throw err;
  }
  assert.match(checkLibrary(dir).join("\n"), /not a regular file/);
});

test("malformed JSON is reported without falling through to release-file checks", t => {
  const { dir, write } = fixture(t, catalog());
  write("catalog.json", "{unfinished");
  assert.match(checkLibrary(dir).join("\n"), /Cannot read library\/catalog\.json/);
});
