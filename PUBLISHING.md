# Publish a factsheet, report, or publication

The website is hosted on GitHub Pages. Readers do not upload anything. An institute maintainer prepares a release locally, reviews it on a GitHub branch, then merges it to the branch used by Pages.

## Before putting files on GitHub

- Confirm the final wording, attribution, citation, release date, accessibility, and permission to distribute each file. Check the PDF itself, including links, QR codes, comments, and embedded attachments.
- **A branch or pull request in this public repository is not private.** Keep drafts, unpublished curriculum, research instruments, confidential data, and participant responses off GitHub. Prepare a private review elsewhere first.
- Use one record for both showcase and printer-friendly versions of the same factsheet. Give an Epidemiology Explained lesson its exact identifier, e.g. `EE 2.11`. It will appear in both the general collection and its series collection; do not create two catalog entries.
- For work owned by a publisher, use the authorized DOI or publisher URL instead of uploading a copy you cannot redistribute.

## Add a release without editing code

Choose a subject that describes what the release is *about*, not its format. The primary and optional additional topics let one catalog record appear in several places; do not upload a second copy for the topic page. *Epidemiology Explained* is a series, not a disease topic. Use **Companion resources** to link a methods lesson without tagging it as a disease report.

**Public service announcements** and **Agriculture** are independent collections, not document formats or diagnoses. A release can belong to either or both, with or without health topics. For instance, a public announcement about farmworker pesticide exposure could be a factsheet tagged **Injuries, violence & harmful exposures**, **PSA**, and **Agriculture**. Prepare a single entry and a single set of files.

Under **Release page, related work & placement**, you can provide a plain-language takeaway, geography, period covered by the data, exact citation, version and a short public revision note. Give complete citation/attribution and data scope when available, especially for a report or external paper. A lesson with no data period does not need one. Select companion items from the current catalog and choose the originating project/study where relevant. Published findings can link to a study even when it is closed; this never opens recruitment. To show a release as an example on Services, select only applicable services. Featuring a finding deliberately transfers the single homepage spotlight from the previously featured item.

1. From the latest `main` in [the website repository](https://github.com/colinferrel13-cell/acropolisanalyticsri-site), create a review branch named, for example, `release-your-topic`. Use letters, numbers, and hyphens. The account completing the upload needs write access.
2. Open **`manage-publications.html`** on the updated website or a local preview. Select the collection, title, authors, public release date, short summary, and a unique library ID. Select the series and lesson number only when applicable. IDs use lowercase letters, numbers, and hyphens. Do not enter private notes: everything in the final catalog is public.
3. Choose the approved PDF(s) from your computer, or give a publication its HTTPS publisher/DOI link. If you have both editions, mark the first as **Showcase** and choose the **Printer-friendly** PDF in the second field. The form accepts up to 25 MiB per PDF. A factsheet or report always requires at least one PDF.
4. Start from the correct catalog: the tool fetches the catalog from the site it is served from. **If the branch contains newer releases than the site, if you work offline, or if preparing several additions on one branch, choose that branch's latest `library/catalog.json` under the offline option.** Never use an older saved catalog as a replacement. The tool refuses an invalid catalog or duplicate entry; it never silently starts from an empty list when loading fails.
5. Confirm distribution rights and select **Prepare release files**. Review the title, count of retained entries, and filenames. Save every offered file into an empty folder on your computer. The generated JSON is your starting catalog plus one new entry. The PDFs are unchanged copies with safe names based on the ID. Keep the exact names, including `catalog.json`, and remove any suffix such as ` (1)` added by the browser.
6. Enter your existing review branch's name and select **Open branch upload on GitHub**. Upload the downloaded files together under `library/` on that branch, not at the repository root. Only `catalog.json` should replace an existing file. If a proposed PDF name already exists anywhere in that folder, stop and use a new ID or follow the correction procedure below. No credentials are entered on the Acropolis website.
7. Open a pull request to `main`. Review the actual diff: it must retain every existing entry, add the intended metadata and files, and only move the previous homepage spotlight if requested. For simultaneous releases, refresh from the latest `main` and reconcile changes before merging. Inspect the PDFs and test publisher links. Do not merge when a validation check fails.
8. After merging, wait for the normal Pages deployment. Visit the public library and test **View PDF**, **Download**, any publisher link, and both editions on a phone. To cite or share the specific work, use its permanent `release.html?id=YOUR-ID` page. For a print code that should always show the whole group, use the group directory below.

The form downloads files to your device. It does not automatically log you in, create a branch, upload files, merge a pull request, start a deployment, or store credentials. If you abandon a release, close the page or choose **Clear form**; no site changes occur.

## Use a group QR on a factsheet or report

Open the [group link & QR directory](https://acropolisanalyticsri.com/topics/), choose the group, and download its SVG (for vector print layouts) or PNG. The directory also offers a ZIP of all codes and a table of their URLs. Put a caption such as **More on heart, blood & circulation** beside the code, and include the readable, clickable group address. Do not print “Read this report” next to a code that points to a group. Keep the white border intact and test a final-size printed proof.

The `/topics/<id>/` address is independent of titles, PDF editions, and subsequent releases. An empty group still has a usable landing page; adding a matching catalog record fills it automatically. The main library's filters continue to show published holdings only. Never reuse or delete a printed destination. Keep serving the original URL if labels or groupings change.

**Maintainer note:** after adding a permanent group in the catalog schema, run `node tools/build-topic-pages.cjs`, `python tools/generate-topic-qr.py` (ReportLab and Pillow), then `python tools/package-topic-qr.py`. Add its permanent address to `sitemap.xml`. Review the new page, scan the code, and check the bundle before publishing. Adding a release to an existing group does not require rebuilding the pages or artwork.

## Manual alternative and corrections

From an up-to-date checkout, save approved PDFs directly under `library/`. Edit `library/catalog.json` on a review branch, not a reader-facing HTML file. The root is `{"version":1,"items":[...]}`. Each item requires `id`, `type`, `title`, `summary`, `date` (YYYY-MM-DD), `authors`, and `files`. Allowed types are `factsheet`, `report`, and `publication`. Each file record has `name` (a PDF basename without folders or spaces), `label` (PDF, Showcase, or Printer-friendly), and `bytes` (the file's exact byte count). `url` is optional; link-only publications use `files: []` with the external HTTPS publisher page. An EE factsheet uses `series: "epidemiology-explained"` and a unique string `lesson`, including its leading/trailing zeroes.

The form is **add-only**. To correct metadata, edit the existing record in a pull request. For a revised document, keep its existing stable entry ID, give the new file a versioned filename, update its metadata and exact byte size, and review the effect on previously shared links before removing any file. Do not create a second entry for an existing lesson or silently replace a cited PDF with materially different content.

### Catalog extensions

- `topics`: ordered, distinct topic IDs from the controlled vocabulary in `assets/library-schema.js`. The first is primary. Condition groups have permanent pages even before a release. Other cross-cutting subjects retain their library filter links. Older records without topics remain searchable by title and metadata.
- `collections`: optional, distinct IDs (`psa`, `agriculture`). Collections work alongside topics and the EE series. They do not change a report into a factsheet or indicate survey recruitment.
- `takeaway`, `geography`, `dataPeriod`, `citation`, `version`, `revision`: optional plain text. The required `date` is the actual public release date, not the years represented by the data.
- `related`: optional array of existing release IDs; a single reference creates a link on both pages. `supersedes`: an earlier record's ID when there is a distinct new release; the earlier record and its citation remain accessible. If editing an existing EE lesson, retain its unique lesson ID and record, and explain changes in its revision note.
- `project`: a supported program ID (currently `paeon`). `study`: an ID in `surveys/registry.json`. Neither is a survey URL. `services`: one or more of `mapping`, `surveys`, `reporting`, used only when a release is a suitable public example. `featured`: optional boolean; at most one record can be true.
- Before merging, run `node tools/check-library.js` and `node --test tools/check-library.test.js` from the website root. The check validates metadata, revision/companion references, survey IDs, and the PDF inventory, but cannot determine scientific approval or accessibility.
