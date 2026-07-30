# Public survey project pages

Each public-facing survey receives a permanent directory under `surveys/`.
The directory's `index.html` is the study information page used by website
links and QR codes.

## Required lifecycle labels

- **In development** — participation is not open.
- **Open** — eligible visitors can reach the active questionnaire.
- **Paused** — an active project has temporarily stopped accepting responses.
- **Closed** — response collection has ended.

Track **Outputs available** separately from recruitment status and link reviewed
findings or approved public data from `outputs.html`.

Never describe a project as open until its active questionnaire, participant
information, consent or acknowledgment, privacy language, contact route, and
response system have all been reviewed and tested.

## Add a survey

1. Copy an existing study directory and give it a short permanent slug.
2. Update its title, description, canonical URL, eligibility, status, study
   facts, planned topics, and project contacts.
3. Add a card to `participate.html`.
4. Add the permanent study URL to `sitemap.xml`.
5. Update `privacy.html` before enabling any new data collection or external
   service.
6. Test the active survey and its study page on desktop, mobile, and with
   keyboard navigation.

## Data boundary

This public repository may contain participant-facing study materials and
approved public releases. It must never contain raw survey responses,
participant verification records, contact information, protected health
information, personally identifiable information, credentials, or restricted
research data.
