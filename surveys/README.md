# Maintaining the public survey directory

`participate.html` lists public study information. It does not host a questionnaire, store responses, or run a repeat-participation check. The caregiver study is currently **in development** and has no live form. Its stable page is `/surveys/adrd-caregiver/`.

## Add a study

1. Create a permanent lowercase folder under `surveys/` (letters, digits, single hyphens). Add an accessible `index.html` with the study's purpose, status, and contact. Use that stable page for hyperlinks and QR codes.
2. Edit `surveys/registry.json` on the same review branch. Duplicate the existing object, keeping the comma between entries, and fill in the fields below. Add only genuine participant-facing studies. Do not publish review drafts, placeholder entries, private recruitment notes, or questionnaire edit links.
3. Add the new study page to `sitemap.xml`. Add a plain HTML link to the study in the fallback area of `participate.html` if participants must be able to discover it without JavaScript. Direct study pages work without JavaScript.
4. Preview the changes, verify every study page and its recruitment state, then publish them together through the repository's normal review process. Survey status changes must reach the landing page, directory entry, project references, and any live collection service together.

| Registry field | Meaning |
| --- | --- |
| `id` | Unique permanent directory name, e.g. `adrd-caregiver`. The directory links to `surveys/<id>/`; it never links straight to a form. |
| `status` | Exactly one of `development`, `open`, `paused`, or `closed`. |
| `title` | Public study name, in plain text. |
| `summary` | One or two sentences on the purpose of the study. |
| `audience` | Plain-language planned audience or reviewed participant group. Full eligibility details belong on the study page. |
| `duration` | A reviewed time estimate, such as minutes to complete. Mandatory for open studies; omit while unknown. |

The catalogue is public. It accepts no external URLs, arbitrary page paths, HTML, or extra record fields. The directory groups studies automatically and shows an empty message for groups without entries. Malformed or unavailable data produces a loading-error message, not a false claim that no studies are open.

## Open, pause, and close

- **Development:** no recruitment and no questionnaire button. Never describe a proposed 365-day rule as implemented.
- **Open:** first review and test the actual collection service, confirm eligibility, estimated time, consent, privacy, retention, any verification method, accessibility, study contact, and applicable approvals. Publish these on the stable study page **before** its clearly labeled participant link to the reviewed HTTPS questionnaire. Only then change the registry status to `open` and supply the reviewed duration. The directory still takes readers to the study page.
- **Paused or closed:** stop accepting responses at the collection service itself; remove/disable the questionnaire link and update the study page and registry together. Changing a directory label alone cannot close a third-party form.
- **Results:** release availability is separate from recruitment. In the publication manager, associate a reviewed aggregate report with the study ID. Its release page links back to that study. To display its findings on the landing page, follow the caregiver example: use a hidden `data-context-releases="study:your-study-id"` container and the shared library-schema and context-releases scripts. Do not mark a study open just because results are available.

## Verification

From the repository root, run `node --test tests/survey-directory.test.cjs` if Node.js is installed. The tests use in-memory examples, not public studies. Serve the site over HTTP for browser checks; opening `participate.html` via a local file URL may block the registry request.

Check the open, planned, and archive sections; read the caregiver details with JavaScript disabled; and verify that a registry-loading failure leaves access to an actual information page. Also test keyboard navigation, mobile layout, status updates, and any live participant-facing route before release.

## Data boundary

Only public study metadata and participant-facing information belong in this repository. Never commit answers, participant or volunteer contacts, IP addresses, device fingerprints, verification records, raw free text, credentials, or other restricted information. Do not enable new response collection, analytics, or repeat controls without an appropriate reviewed service and accurate privacy disclosures.
