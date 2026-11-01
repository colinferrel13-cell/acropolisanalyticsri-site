# Acropolis Analytics Research Institute website

This repository contains the public website for Acropolis Analytics Research
Institute, LLC. It is a dependency-free static site hosted through GitHub Pages.

## Site structure

- `index.html` — homepage and top-level positioning
- `about.html` — institute overview and independence statement; `colin-ferrel.html` is the academic profile
- `projects.html` — research index; `paeon.html` explains PAEON and its planned applications
- `methods.html` — sources, uncertainty, attribution, release principles, and corrections
- `participate.html` — public research participation hub and recruitment status
- `surveys/` — stable participant-facing project pages and survey workflow notes
- `services.html` — applied analytics capabilities and engagement process
- `outputs.html` — topic-first research library and cross-format search; `data.html` preserves the legacy data link
- `release.html?id=ID` — permanent, shareable HTML record for a work (including its PDF editions or publisher link)
- `topics/` — permanent public landing pages for 11 health topics and two collections. Print artwork is maintained separately in the institute’s style guides and is not served from this repository.
- `factsheets.html` — searchable public factsheet releases
- `epidemiology-explained.html` — numbered lessons in a collection within Factsheets
- `reports.html` — full reports, publications and authorized external links
- `manage-publications.html` — local release preparation; publication requires repository write access
- `library/` — public release catalog and approved PDFs only
- `contact.html` — email-based inquiry route
- `privacy.html` — website privacy notice
- `404.html` — custom GitHub Pages error page
- `style.css` — shared design system and responsive behavior
- `site.js` — mobile navigation, current-year, and scroll-ornament behavior
- `robots.txt` and `sitemap.xml` — search-engine discovery

The site intentionally uses plain HTML, CSS, and a small amount of JavaScript.
This keeps GitHub Pages deployment simple and makes the source easy to maintain.

## Brand artwork

Web-ready versions of the institute artwork live in `assets/brand/`. These files
are cropped, transparent WebP derivatives sized for the website; the full source
images remain outside the repository.

- `helmet-accent.webp`, `shield-accent.webp`, and `laurel-accent.webp` are for
  navigation marks, card accents, status markers, and other small placements.
- `helmet-shield.webp`, `helmet-column.webp`, and `shield-column.webp` are for
  large compositions and section watermarks.
- `column-cracked.webp`, `column-damaged.webp`, and
  `column-destroyed.webp` provide page-specific and footer backgrounds.

Page-hero artwork is assigned through modifier classes such as
`page-hero--research` and `page-hero--participate` in `style.css`. Decorative
images should use empty alternative text. If an image conveys information rather
than atmosphere, add concise alternative text that communicates its purpose.

Each long-form page selects two oversized background ornaments on its `<body>`
with `data-ornament-one` and `data-ornament-two`. Supported values are
`column-cracked`, `column-damaged`, `column-destroyed`, `helmet-column`,
`shield-column`, and `helmet-shield`. The shared script places them at separate
points down the page and gives them a restrained scroll-linked movement; visitors
who prefer reduced motion receive the same composition without movement.
Adjacent content sections receive a larger crest divider automatically, and
call-to-action panels use the combined helmet-and-shield mark.

## Preview locally

Run a static file server from the repository root:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/`.

Opening the files directly from disk works for most content checks, but a local
server is required for the JSON-driven library and survey pages.

## Add a research project

1. Open `projects.html`.
2. Add a short project entry linking to its program or study information page.
3. Give the project a question, scope, and honest status; label proposed work as planned.
4. If it has an approved release, use [the publishing guide](PUBLISHING.md) to add the catalog record. Link to its permanent publication page, not only to a particular PDF edition. A program/study tag connects published work to the corresponding page independently of recruitment status.
5. Add the new page to `sitemap.xml` if it receives its own HTML file.

Use status language conservatively. Gold labels mean planned, in development, or
roadmap work; green is reserved for active recruitment or an active public
release; neutral labels should be used for paused or closed work.

## Add a public participation project

Add a stable study landing page and a record in `surveys/registry.json`. Follow the [survey workflow and activation checklist](surveys/README.md). The directory groups studies by status; listing a planned study does not open recruitment. Do not store responses, participant verification records, volunteer contacts or backend secrets in this repository.

## Add a data release

Place public files in a project-specific directory such as:

```text
downloads/
  paeon/
    2026-01/
      README.txt
      data.csv
      data-dictionary.csv
      methods.txt
```

Add a release card to `outputs.html` with:

- project and release title
- version and release date
- population, geography, and time period
- file formats and sizes
- methods note and data dictionary
- limitations and appropriate uses
- citation and use conditions
- contact information

Never commit protected health information, personally identifiable information,
restricted records, credentials, or partner-confidential data to this repository.
Keep downloadable publication PDFs in the reviewed `library/` inventory, not alongside separate data extracts.

## Publish factsheets, reports and publications

Follow the [publishing instructions](PUBLISHING.md) for the maintainer page, PDF upload and GitHub review. A lesson is entered once and appears in both Factsheets and Epidemiology Explained. The public `library/` directory is not a draft storage area (even on a review branch). Do not add templates, authoring catalogs, or unreleased files. Use `node tools/check-library.js` to validate the library and `node --test` for regression checks.

## Contact workflow

The contact page currently uses a direct email link to
`info@acropolisanalyticsri.com`. This is functional on a static GitHub Pages
site and avoids presenting a form that does not have a working backend.

If a hosted form is added later:

1. Select and configure a form provider.
2. Review its privacy, security, retention, and spam-protection settings.
3. Update `privacy.html` before enabling the form.
4. Do not describe ordinary web form submission as a secure data-transfer method.
5. Continue to prohibit protected, confidential, or restricted data in the form.

## Publishing

GitHub Pages publishes from the repository source configured in the repository
settings. Use a feature branch and pull request for material changes, review the
preview, and merge only after the desktop and mobile layouts have been checked.

The custom domain is defined in `CNAME`. Keep that file unchanged unless the
domain itself changes.

## Pre-publication checklist

- All navigation links work on desktop and mobile.
- Each page has one `h1` and a logical heading order.
- New images have useful alternative text unless they are decorative.
- Public outputs include status, attribution, limitations, and permissions.
- Participation pages use accurate recruitment labels and do not expose an
  unfinished form, survey endpoint, or misleading submit control.
- No placeholders, credentials, confidential records, or restricted data remain.
- `sitemap.xml` includes new public pages.
- The privacy notice reflects any new forms, analytics, or external services.
