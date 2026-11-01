/* Stable per-publication page for readers, print references, bookmarks, and QR codes. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const el = (tag, txt, cls) => { const n=document.createElement(tag); if(txt) n.textContent=txt; if(cls) n.className=cls; return n; };
  const a = (text, href) => { const n=el('a',text); n.href=href; return n; };
  const dateLabel = date => new Date(date+'T00:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
  function notice(title, description) {
    $('record-title').textContent=title;
    $('record-summary').textContent=description;
    $('record-status').textContent='';
    $('record-layout').hidden=true;
    $('record-message').hidden=false;
  }
  function section(id, title) {
    const box=el('section'), h=el('h2',title); box.id=id; h.id=id+'-title'; box.setAttribute('aria-labelledby',h.id);
    box.append(h); $('record-body').append(box);
    const li=el('li'); li.append(a(title,'#'+id)); $('record-contents').append(li); return box;
  }
  function list(parent, entries) {
    const ul=el('ul');
    for(const [label,url] of entries) { const li=el('li'); li.append(a(label,url)); ul.append(li); }
    parent.append(ul);
  }
  function display(item, catalog, api) {
    const byId=new Map(catalog.items.map(entry=>[entry.id,entry]));
    const itemURL=api.releaseURL(item.id);
    const publicURL='https://acropolisanalyticsri.com'+itemURL;
    const canonical=el('link'); canonical.rel='canonical'; canonical.href=publicURL; document.head.append(canonical);
    const title=item.title+' | Acropolis Analytics Research Institute';
    document.title=title;
    document.querySelector('meta[property="og:title"]').content=title;
    for(const selector of ['meta[name="description"]','meta[property="og:description"]']) document.querySelector(selector).content=item.summary;
    const og=el('meta'); og.setAttribute('property','og:url'); og.content=publicURL; document.head.append(og);
    const type={factsheet:'Factsheet',report:'Full report',publication:'Publication'}[item.type];
    $('record-type').textContent=[type,item.lesson].filter(Boolean).join(' · ');
    $('record-title').textContent=item.title;
    $('record-summary').textContent=item.summary;
    const newer=catalog.items.filter(entry=>entry.supersedes===item.id);
    if(newer.length) {
      const mark=$('record-revision'); mark.append('A newer version is available: ');
      newer.forEach((entry,i)=>{ if(i) mark.append('; '); mark.append(a(entry.title,api.releaseURL(entry.id))); }); mark.hidden=false;
    }
    const context=section('overview','About this release');
    if(item.takeaway) context.append(el('h3','Key takeaway'),el('p',item.takeaway));
    const facts=el('dl',null,'paper-panel release-details');
    for(const [term,val] of [['Author or team',item.authors],['Published',dateLabel(item.date)],['Data period',item.dataPeriod],['Geography',item.geography],['Version',item.version]]) {
      if(val) { const row=el('div'); row.append(el('dt',term),el('dd',val)); facts.append(row); }
    }
    context.append(facts);
    const subjectIds=api.itemTopics(item);
    if(subjectIds.length) {
      context.append(el('h3','Topics'));
      list(context,subjectIds.map(id=>[api.topics[id],api.topicURL(id)]));
    }
    if(item.revision) context.append(el('h3','Revision note'),el('p',item.revision));
    if(item.supersedes) context.append(a('Previous version: '+byId.get(item.supersedes).title,api.releaseURL(item.supersedes)));

    const access=section('access','Read or download');
    if(item.files.length) {
      const files=el('ul',null,'release-file-list');
      for(const f of item.files) {
        const row=el('li'), href='/library/'+encodeURIComponent(f.name);
        const size=f.bytes < 1048576 ? Math.max(1,Math.round(f.bytes/1024))+' KB' : (f.bytes/1048576).toFixed(1)+' MB';
        const fileLabel=f.label==='PDF'?'PDF':f.label+' PDF';
        const view=a('View PDF',href), save=a('Download PDF',href); save.download=f.name;
        view.setAttribute('aria-label','View '+fileLabel+' of '+item.title); save.setAttribute('aria-label','Download '+fileLabel+' of '+item.title);
        row.append(el('strong',fileLabel+' · '+size),el('br'),view,save); files.append(row);
      }
      access.append(files);
    }
    if(item.url) access.append(a('Read at the publisher or repository',item.url));
    const cite=section('cite','Cite this work');
    const citation=item.citation || [item.authors+'.', '('+item.date.slice(0,4)+').',item.title+'.',item.version?'Version '+item.version+'.':'',item.url || publicURL].filter(Boolean).join(' ');
    const citeText=el('p',citation,'release-citation'); cite.append(citeText);
    const copy=el('button','Copy citation','button button-secondary no-print'); copy.type='button';
    const copied=el('p'); copied.setAttribute('role','status'); copied.className='no-print';
    copy.onclick=async()=>{
      try { await navigator.clipboard.writeText(citation); copied.textContent='Citation copied.'; }
      catch { const range=document.createRange(); range.selectNodeContents(citeText); const sel=window.getSelection(); if(sel){sel.removeAllRanges();sel.addRange(range);} copied.textContent='Citation selected. Use your device’s Copy command.'; }
    };
    cite.append(copy,copied);
    const companions=catalog.items.filter(entry=>(item.related || []).includes(entry.id) || (entry.related || []).includes(item.id));
    const links=companions.map(entry=>[entry.title+' — '+({report:'full report',factsheet:'factsheet',publication:'publication'}[entry.type]),api.releaseURL(entry.id)]);
    if(item.series) links.push(['Epidemiology Explained learning series','/epidemiology-explained.html']);
    if(item.project==='paeon') links.push(['PAEON research program','/paeon.html']);
    if(item.study) links.push([item.study==='adrd-caregiver'?'ADRD caregiver study information':'Study information and recruitment status','/surveys/'+encodeURIComponent(item.study)+'/']);
    if(links.length) list(section('related','Related work'),links);
    const help=section('questions','Questions or corrections');
    help.append(a('Ask a question or suggest a correction','/contact.html#corrections'),el('p','Please include the title, version or date, and the figure, table, or passage in question.'));
    $('record-layout').hidden=false; $('record-message').hidden=true;
    if(location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }
  async function init() {
    const id=new URLSearchParams(location.search).get('id');
    if(!id) return;
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return notice('Release not found','This address does not identify a public release. Look for the title in the research library.');
    $('record-status').textContent='Loading the publication record…';
    const ctl=new AbortController(), timeout=setTimeout(()=>ctl.abort(),12000);
    try {
      const response=await fetch('/library/catalog.json',{cache:'no-cache',mode:'same-origin',credentials:'omit',signal:ctl.signal});
      if(!response.ok) throw Error();
      const catalog=await response.json(), api=window.PublicationCatalog;
      if(!api || api.validate(catalog).length) throw Error();
      const item=catalog.items.find(entry=>entry.id===id);
      if(!item) return notice('Release not found','No public record matches this address. Browse the library or contact Acropolis with the title.');
      display(item,catalog,api);
    } catch { notice('The publication record could not load','Please refresh the page or contact Acropolis for a copy.'); }
    finally { clearTimeout(timeout); }
  }
  init();
})();
