/* Rebuild the public, offline-readable topic directory and permanent QR landings.
   Run from any directory: node tools/build-topic-pages.cjs [--check].
   Actual released records are read at visit time; publishing a PDF needs no page rebuild. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {groups} = require('../assets/library-schema.js');
const site = path.resolve(__dirname, '..');
const origin = 'https://' + fs.readFileSync(path.join(site, 'CNAME'), 'utf8').trim();
const shell = fs.readFileSync(path.join(site, 'outputs.html'), 'utf8').replace(/\r\n/g,'\n');
const esc = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const groupPath = slug => '/topics/' + slug + '/';
const qrPath = (slug, type) => '/assets/qr/' + slug + '.' + type;
const entries = Object.entries(groups);
if (!entries.length || entries.some(([slug,group]) =>
  !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !group.label || !group.description || !['topic','collection'].includes(group.kind)))
  throw Error('Invalid topic or collection register.');

function shellPart(tag) {
  const snippet = shell.match(new RegExp('<' + tag + '\\b[\\s\\S]*?</' + tag + '>'))?.[0];
  if (!snippet) throw Error('Could not read shared ' + tag + ' from the library.');
  return snippet.replace(/(href|src)="(?!\/|#|https?:|mailto:)([^"]+)"/g, '$1="/$2"')
    .replace(/aria-current="page"/g,'aria-current="location"');
}
const header = shellPart('header'), footer = shellPart('footer');
function wrap(slug, name, summary, main) {
  const canonical = origin + (slug ? groupPath(slug) : '/topics/');
  const title = esc(name + ' | Acropolis Analytics Research Institute');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${esc(summary)}">
  <meta name="theme-color" content="#050814">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/assets/brand/helmet-accent.webp" type="image/webp">
  <link rel="stylesheet" href="/style.css?v=20260731-3">
  <link rel="stylesheet" href="/assets/library.css">
  <link rel="stylesheet" href="/assets/read.css?v=1">
  <link rel="stylesheet" href="/assets/topics.css">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Acropolis Analytics Research Institute">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${esc(summary)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${origin}/og.png">
  <meta property="og:image:alt" content="Acropolis Analytics Research Institute, Science, Medicine and Humanity">
  <meta name="twitter:card" content="summary_large_image">
  <script src="/site.js?v=20260731-1" defer></script>${slug ? `
  <script src="/assets/library-schema.js?v=topic-groups-1" defer></script>
  <script src="/assets/library.js?v=topic-groups-1" defer></script>` : ''}
</head>
<body data-ornament-one="column-cracked" data-ornament-two="shield-column">
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <div class="page">
    ${header}
    <main id="main-content" tabindex="-1">
${main}
    </main>
    ${footer}
  </div>
</body>
</html>
`;
}
function downloads(slug, label, compact = false) {
  return ['svg','png'].map(ext => {
    const display = (compact ? '' : 'Download ') + ext.toUpperCase();
    return `<a href="${qrPath(slug,ext)}" download="acropolis-${slug}-qr.${ext}" aria-label="${esc('Download ' + ext.toUpperCase() + ' QR code for ' + label)}">${display}</a>`;
  }).join(' ');
}
function crumbs(here, isHub) {
  return `<nav class="library-breadcrumb" aria-label="Breadcrumb"><a href="/outputs.html">Research library</a><span aria-hidden="true">/</span>${isHub ? '' : '<a href="/topics/">Topic directory</a><span aria-hidden="true">/</span>'}<span aria-current="page">${esc(here)}</span></nav>`;
}
function directory(kind) {
  return entries.filter(([,g]) => g.kind === kind)
    .sort(([,a],[,b]) => a.label.localeCompare(b.label,'en'))
    .map(([slug,g]) => `          <li class="topic-entry">
            <h3><a href="${groupPath(slug)}">${esc(g.label)}</a></h3>
            <p>${esc(g.description)}</p>
            <div class="topic-file-links"><span>QR code:</span> ${downloads(slug,g.label,true)}</div>
          </li>`).join('\n');
}
function hub() {
  const summary='Browse health topics, Public Service Announcements (PSAs), and Agriculture. Download permanent QR codes for printed factsheets and reports.';
  return wrap(null, 'Topic directory & QR codes', summary, `      <section class="page-hero page-hero--outputs reading-hero">
        <div class="container">
          ${crumbs('Topic directory',true)}
          <span class="eyebrow">Research library</span>
          <h1>Topic directory &amp; QR codes</h1>
          <p class="lede">Choose a subject to find its factsheets, reports, and publications. Each page has a permanent address you can share online or print as a QR code.</p>
          <nav class="library-nav actions" aria-label="Directory sections"><a href="#conditions">Condition groups</a><a href="#collections">Collections</a><a href="#print">QR codes for print</a></nav>
        </div>
      </section>
      <section class="section section-compact" id="conditions" aria-labelledby="conditions-title">
        <div class="container">
          <div class="section-heading">
            <div><span class="eyebrow">Browse by subject</span><h2 id="conditions-title">Condition groups</h2></div>
            <p>These addresses are reserved even when a group has no published work yet. To search only released material, use the <a href="/outputs.html">research library</a>.</p>
          </div>
          <ul class="topic-directory-list">${'\n' + directory('topic')}
          </ul>
        </div>
      </section>
      <section class="section section-muted section-compact" id="collections" aria-labelledby="collections-title">
        <div class="container">
          <div class="section-heading">
            <div><span class="eyebrow">Across subjects</span><h2 id="collections-title">Collections</h2></div>
            <p>A release can appear in a collection and a condition group. For instance, a public service announcement about farm safety could appear in both collections.</p>
          </div>
          <ul class="topic-directory-list">${'\n' + directory('collection')}
          </ul>
        </div>
      </section>
      <section class="section section-compact" id="print" aria-labelledby="print-title">
        <div class="container topic-print-note">
          <div>
            <span class="eyebrow">For authors &amp; educators</span>
            <h2 id="print-title">Add a QR code to a document</h2>
            <p>Choose a single image above, or download all topic and collection codes together.</p>
            <a class="button button-primary" href="/assets/qr/acropolis-topic-qr.zip" download>Download all QR codes (ZIP)</a>
          </div>
          <ol>
            <li><strong>Choose the destination.</strong> A topic code opens its library page, not an individual PDF. Future releases use the same address.</li>
            <li><strong>Insert the image.</strong> Use SVG for scalable print artwork or PNG for an image-based layout. Keep it square, with its original white margin.</li>
            <li><strong>Test the finished page.</strong> Print the destination URL beside the code. Scan a proof at its final size and confirm it opens the intended topic.</li>
          </ol>
        </div>
      </section>`);
}
function landing(slug,g) {
  const kind=g.kind==='topic' ? 'Condition group' : 'Collection';
  const url=origin + groupPath(slug);
  return wrap(slug,g.label,g.description,`      <section class="page-hero page-hero--outputs reading-hero">
        <div class="container">
          ${crumbs(g.label,false)}
          <span class="eyebrow">${kind}</span>
          <h1>${esc(g.label)}</h1>
          <p class="lede">${esc(g.description)}</p>
          <nav class="library-nav actions" aria-label="Page sections"><a href="#releases">Public releases</a><a href="#share">Share this page</a></nav>
        </div>
      </section>
      <section class="section section-compact" id="releases" aria-labelledby="releases-title">
        <div class="container">
          <div class="section-heading">
            <div><span class="eyebrow">Research library</span><h2 id="releases-title">Public releases</h2></div>
            <p>This list brings together published factsheets, reports, and publications associated with this ${g.kind === 'topic' ? 'subject' : 'collection'}.</p>
          </div>
          <div data-library-list="group" data-group="${slug}"><p class="catalog-loading" role="status" hidden>Loading releases…</p></div>
          <noscript><p>Enable JavaScript to load the current release list, or <a href="/contact.html">contact the institute</a> for an accessible copy.</p></noscript>
        </div>
      </section>
      <section class="section section-muted section-compact" id="share" aria-labelledby="share-title">
        <div class="container topic-sharing">
          <div class="topic-sharing-copy">
            <span class="eyebrow">Print &amp; share</span>
            <h2 id="share-title">Share this ${g.kind === 'topic' ? 'topic' : 'collection'}</h2>
            <p>Use this permanent address in a factsheet, report, or handout. It stays the same as new work is added.</p>
            <p class="topic-permalink"><a href="${url}">${url}</a></p>
            <div class="topic-file-links">${downloads(slug,g.label)}</div>
            <p class="topic-print-guide"><a href="/topics/#print">Print guidance and all QR codes</a></p>
          </div>
          <figure class="topic-code">
            <img src="${qrPath(slug,'svg')}" width="160" height="160" loading="lazy" alt="${esc('QR code linking to ' + g.label)}">
            <figcaption>Scan to open this page</figcaption>
          </figure>
        </div>
      </section>`);
}
function build(check) {
  const files = new Map([['topics/index.html',hub()]]);
  for(const [slug,g] of entries) files.set('topics/'+slug+'/index.html',landing(slug,g));
  const stale=[];
  for(const [rel,data] of files) {
    const name=path.join(site,rel);
    let old;
    try { old=fs.readFileSync(name,'utf8').replace(/\r\n/g,'\n'); } catch(e) { if(e.code!=='ENOENT') throw e; }
    if(old === data) continue;
    if(check) stale.push(rel);
    else { fs.mkdirSync(path.dirname(name),{recursive:true});fs.writeFileSync(name,data); }
  }
  if(stale.length) throw Error('Stale generated topic pages: '+stale.join(', ')+'. Run node tools/build-topic-pages.cjs.');
  console.log((check?'Checked ':'Built ')+files.size+' static topic pages.');
}
if(require.main===module) {
  if(process.argv.slice(2).some(a=>a!=='--check')) throw Error('Usage: node tools/build-topic-pages.cjs [--check]');
  build(process.argv.includes('--check'));
}
