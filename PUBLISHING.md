# Publish a factsheet, report, or publication

The website is hosted on GitHub Pages. Readers do not upload anything. An institute maintainer prepares a release locally, reviews it on a GitHub branch, then merges it to the branch used by Pages.

## Before putting files on GitHub

- Confirm the final wording, attribution, citation, release date, accessibility, and permission to distribute each file. Check the PDF itself, including links, QR codes, comments, and embedded attachments.
- **A branch or pull request in this public repository is not private.** Keep drafts, unpublished curriculum, research instruments, confidential data, and participant responses off GitHub. Prepare a private review elsewhere first.
- Use one record for both showcase and printer-friendly versions of the same factsheet. Give an Epidemiology Explained lesson its exact identifier, e.g. `EE 2.11`. It will appear in both the general collection and its series collection; do not create two catalog entries.
- For work owned by a publisher, use the authorized DOI or publisher URL instead of uploading a copy you cannot redistribute.

## Add a release without editing code

1. From the latest `main` in [the website repository](https://github.com/colinferrel13-cell/acropolisanalyticsri-site), create a review branch named, for example, `release-your-topic`. Use letters, numbers, and hyphens. The account completing the upload needs write access.
2. Open **`manage-publications.html`** on the updated website or a local preview. Select the collection, title, authors, public release date, short summary, and a unique library ID. Select the series and lesson number only when applicable. IDs use lowercase letters, numbers, and hyphens. Do not enter private notes: everything in the final catalog is public.
3. Choose the approved PDF(s) from your computer, or give a publication its HTTPS publisher/DOI link. If you have both editions, mark the first as **Showcase** and choose the **Printer-friendly** PDF in the second field. The form accepts up to 25 MiB per PDF. A factsheet or report always requires at least one PDF.
4. Start from the correct catalog: the tool fetches the catalog from the site it is served from. **If the branch contains newer releases than the site, if you work offline, or if preparing several additions on one branch, choose that branch's latest `library/catalog.json` under the offline option.** Never use an older saved catalog as a replacement. The tool refuses an invalid catalog or duplicate entry; it never silently starts from an empty list when loading fails.
5. Confirm distribution rights and select **Prepare release files**. Review the title, count of retained entries, and filenames. Save every offered file into an empty folder on your computer. The generated JSON is your starting catalog plus one new entry. The PDFs are unchanged copies with safe names based on the ID. Keep the exact names, including `catalog.json`, and remove any suffix such as ` (1)` added by the browser.
6. Enter your existing review branch's name and select **Open branch upload on GitHub**. Upload the downloaded files together under `library/` on that branch, not at the repository root. Only `catalog.json` should replace an existing file. If a proposed PDF name already exists anywhere in that folder, stop and use a new ID or follow the correction procedure below. No credentials are entered on the Acropolis website.
7. Open a pull request to `main`. Review the actual diff: it must retain every existing entry, add the intended metadata, and add the expected PDF bytes. For simultaneous releases, refresh from the latest `main` and reconcile changes before merging. Inspect the PDFs and test publisher links. Do not merge when a validation check fails.
8. After merging, wait for the normal Pages deployment. Visit the public library and test **View PDF**, **Download**, any publisher link, and both editions on a phone. Link readers to the series or collection page for discovery and use stable file URLs when sharing a particular edition.

The form downloads files to your device. It does not automatically log you in, create a branch, upload files, merge a pull request, start a deployment, or store credentials. If you abandon a release, close the page or choose **Clear form**; no site changes occur.

## Manual alternative and corrections

From an up-to-date checkout, save approved PDFs directly under `library/`. Edit `library/catalog.json` on a review branch, not a reader-facing HTML file. The root is `{"version":1,"items":[...]}`. Each item requires `id`, `type`, `title`, `summary`, `date` (YYYY-MM-DD), `authors`, and `files`. Allowed types are `factsheet`, `report`, and `publication`. Each file record has `name` (a PDF basename without folders or spaces), `label` (PDF, Showcase, or Printer-friendly), and `bytes` (the file's exact byte count). `url` is optional; link-only publications use `files: []` with the external HTTPS publisher page. An EE factsheet uses `series: "epidemiology-explained"` and a unique string `lesson`, including its leading/trailing zeroes.

The form is **add-only**. To correct metadata, edit the existing record in a pull request. For a revised document, keep its existing stable entry ID, give the new file a versioned filename, update its metadata and exact byte size, and review the effect on previously shared links before removing any file. Do not create a second entry for an existing lesson or silently replace a cited PDF with materially different content.
