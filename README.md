# Acropolis Analytics Research Institute website

This repository contains the public website for Acropolis Analytics Research
Institute, LLC. It is a dependency-free static site hosted through GitHub Pages.

## Site structure

- `index.html` — homepage and top-level positioning
- `about.html` — institute mission, founder biography, and independence statement
- `projects.html` — research programs and project roadmap
- `participate.html` — public research participation hub and recruitment status
- `surveys/` — stable participant-facing project pages and survey workflow notes
- `services.html` — applied analytics capabilities and engagement process
- `outputs.html` — combined data, reports, publications, and methods library
- `data.html` and `reports.html` — compatibility redirects to `outputs.html`
- `contact.html` — email-based inquiry route
- `privacy.html` — website privacy notice
- `404.html` — custom GitHub Pages error page
- `style.css` — shared design system and responsive behavior
- `site.js` — mobile navigation and current-year behavior
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

Long-form sections can use the shared `section-art` class with one artwork
modifier, such as `section-art--column-damaged`, `section-art--helmet-column`,
or `section-art--shield-column`. Add `section-art--left` to move the artwork to
the opposite edge. Adjacent content sections receive a small crest divider
automatically, and call-to-action panels use the combined helmet-and-shield mark.

## Preview locally

Run a static file server from the repository root:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/`.

Opening the files directly from disk works for most content checks, but a local
server more closely matches GitHub Pages and is recommended before publishing.

## Add a research project

1. Open `projects.html`.
2. Copy an existing project or workstream `<article class="card">`.
3. Update the heading, description, tags, and status.
4. If the project has a dedicated public release, add a corresponding entry to
   `outputs.html`.
5. Add the new page to `sitemap.xml` if it receives its own HTML file.

Use status language conservatively. Gold labels mean planned, in development, or
roadmap work; green is reserved for active recruitment or an active public
release; neutral labels should be used for paused or closed work.

## Add a public participation project

Keep `projects.html` collaborator-facing and use `participate.html` for
participant-facing recruitment status. Each public study should receive a stable
directory such as:

```text
surveys/
  study-slug/
    index.html
```

To add a project:

1. Copy the structure of `surveys/adrd-caregiver/index.html` into a new,
   descriptive study directory.
2. Add a status card to `participate.html`.
3. State whether recruitment is in development, open, paused, or closed. Track
   reviewed outputs separately so an available report is not mistaken for open
   recruitment. Never imply that a study is accepting responses until its
   collection system is active and tested.
4. Include eligibility, expected time, consent and privacy information, contact
   details, data handling, retention, repeat-participation controls, and public
   reporting plans before activation.
5. Add the stable public URL to `sitemap.xml`.
6. When approved findings are released, link them from the project page and from
   `outputs.html`.

See `surveys/README.md` for lifecycle and repository-boundary guidance. Never
commit raw survey responses, repeat-participation verification records,
volunteer contact data, credentials, service tokens, or backend secrets to this
public repository.

## Add a data release

Place public files in a project-specific directory such as:

```text
downloads/
  paeon/
    2026-01/
      README.txt
      data.csv
      data-dictionary.csv
      methods.pdf
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

## Add a report or publication

Add a new item to `outputs.html` with:

- full citation
- document type and status
- project and intended audience
- author or institute role
- download or persistent external link
- reuse or distribution conditions

Store institute-owned public documents under a descriptive directory such as
`downloads/reports/2026/`. Link to a journal, DOI, repository, or publisher when
that location is the authoritative source.

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
