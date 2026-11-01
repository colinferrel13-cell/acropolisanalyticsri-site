/* Public recruitment metadata only. No participant data or questionnaire URLs belong here. */
(() => {
  'use strict';

  const statusDetails = new Map([
    ['open', ['Open for participation', 'Review eligibility and participation details']],
    ['development', ['In development · not recruiting', 'Read about the planned study']],
    ['paused', ['Paused · not accepting responses', 'Read the study update']],
    ['closed', ['Closed · not accepting responses', 'View the study record']],
  ]);
  const emptyMessages = {
    open: 'No surveys are currently open for participation.',
    development: 'No planned surveys are listed at this time.',
    archive: 'No paused or closed surveys are listed at this time.',
  };

  function groupStudies(registry) {
    const groups = {open: [], development: [], archive: []};
    const ids = new Set();
    const hasText = value => typeof value === 'string' && value.trim().length > 0;
    if (!registry || registry.version !== 1 || !Array.isArray(registry.studies)) {
      throw new Error('Unsupported survey registry.');
    }
    for (const study of registry.studies) {
      if (!study || typeof study.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(study.id) ||
          ids.has(study.id) || !statusDetails.has(study.status) ||
          ![study.title, study.summary, study.audience].every(hasText) ||
          (study.duration !== undefined && !hasText(study.duration)) ||
          (study.status === 'open' && !hasText(study.duration)) ||
          Object.keys(study).some(key => !['id','status','title','summary','audience','duration'].includes(key))) {
        throw new Error('Invalid survey listing.');
      }
      ids.add(study.id);
      const [badge, action] = statusDetails.get(study.status);
      const key = ['closed', 'paused'].includes(study.status) ? 'archive' : study.status;
      // Derive a stable same-site information URL, never a direct questionnaire link.
      groups[key].push({...study, badge, action, href: `surveys/${study.id}/`});
    }
    return groups;
  }

  function makeElement(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function studyCard(study) {
    const card = makeElement('article', '', 'card');
    const badgeClass = study.status === 'development' ? 'status status-planned'
      : study.status === 'open' ? 'status' : 'status status-neutral';
    const facts = makeElement('dl', '', 'meta-list');
    function fact(label, value) {
      const row = makeElement('div');
      row.append(makeElement('dt', label), makeElement('dd', value));
      facts.append(row);
    }
    fact(study.status === 'development' ? 'Planned audience' : 'Study audience', study.audience);
    if (study.duration) fact('Estimated time', study.duration);
    const link = makeElement('a', study.action, 'text-link');
    link.href = study.href;
    link.setAttribute('aria-label', `${study.action}: ${study.title}`);
    card.append(makeElement('span', study.badge, badgeClass), makeElement('h3', study.title),
      makeElement('p', study.summary), facts, link);
    return card;
  }

  async function loadDirectory() {
    const groupsElement = document.querySelector('#survey-groups');
    if (!groupsElement) return;
    const status = document.querySelector('#survey-load-status');
    status.textContent = 'Loading the survey directory…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('surveys/registry.json', {
        credentials: 'omit', mode: 'same-origin', redirect: 'error', cache: 'no-cache', signal: controller.signal,
      });
      if (!response.ok) throw new Error('Survey registry unavailable.');
      const groups = groupStudies(await response.json());
      for (const [key, studies] of Object.entries(groups)) {
        const list = groupsElement.querySelector(`[data-survey-list="${key}"]`);
        list.replaceChildren(...(studies.length ? studies.map(studyCard)
          : [makeElement('p', emptyMessages[key], 'survey-empty')]));
      }
      groupsElement.hidden = false;
      document.querySelector('#survey-fallback').hidden = true;
    } catch {
      // A failed fetch is not evidence that there are no active studies.
      status.textContent = 'The survey directory could not be loaded. Refresh to try again, or use the study page below for its current status.';
    } finally {
      clearTimeout(timeout);
    }
  }

  if (typeof module === 'object' && module.exports) module.exports = {groupStudies};
  if (typeof document !== 'undefined') loadDirectory();
})();
