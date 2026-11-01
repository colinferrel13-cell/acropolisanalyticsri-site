/* Contextual views of the public catalog: no copies, no interest tracking. */
(() => {
  'use strict';
  function select(items, key) {
    const matching = items.filter(item => key === 'featured' ? item.featured === true :
      key.startsWith('service:') ? (item.services || []).includes(key.slice(8)) :
      key.startsWith('study:') ? item.study === key.slice(6) : item.project === key);
    return matching.sort((a,b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))
      .slice(0, key === 'featured' ? 1 : key.startsWith('service:') ? 2 : undefined);
  }
  if (typeof module === 'object' && module.exports) module.exports = { select };
  if (typeof document === 'undefined') return;
  const slots = [...document.querySelectorAll('[data-context-releases]')];
  if (!slots.length) return;
  const el = (tag, value) => { const node = document.createElement(tag); if(value) node.textContent=value; return node; };
  async function populate() {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch('/library/catalog.json', {mode:'same-origin', credentials:'omit', cache:'no-cache', signal:controller.signal});
      if (!res.ok) return;
      const cat = await res.json(), api = window.PublicationCatalog;
      if (!api || api.validate(cat).length) return;
      for (const slot of slots) {
        const key = slot.dataset.contextReleases, matches = select(cat.items, key);
        if (!matches.length) continue;
        const label = el('span', key==='featured' ? 'Featured finding' : key.startsWith('service:') ? 'See this work in practice' : 'Published findings');
        label.className = 'context-label';
        const list = el('ul');
        for(const item of matches) {
          const row=el('li'), link=el('a',item.title); link.href=api.releaseURL(item.id); row.append(link);
          if(key==='featured') row.append(el('p',item.takeaway || item.summary));
          list.append(row);
        }
        slot.classList.add('context-releases');
        slot.replaceChildren(label,list); slot.hidden=false;
      }
    } catch { /* Optional highlights never replace navigation or study information. */ }
    finally { clearTimeout(timeout); }
  }
  populate();
})();
