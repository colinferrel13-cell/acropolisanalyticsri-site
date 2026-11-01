/* Rebuild the public, offline-readable topic directory and permanent subject pages.
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
const entries = Object.entries(groups);
if (!entries.length || entries.some(([slug,group]) =>
  !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !group.label || !group.description))
  throw Error('Invalid health topic register.');

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
  <link rel="stylesheet" href="/assets/topics.css?v=${slug ? 'reader-1' : 'simple-directory-1'}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Acropolis Analytics Research Institute">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${esc(summary)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${origin}/og.png">
  <meta property="og:image:alt" content="Acropolis Analytics Research Institute, Science, Medicine and Humanity">
  <meta name="twitter:card" content="summary_large_image">
  <script src="/site.js?v=20260731-1" defer></script>${slug ? `
  <script src="/assets/library-schema.js?v=unified-topics-1" defer></script>
  <script src="/assets/library.js?v=unified-topics-1" defer></script>` : ''}
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
function crumbs(here, isHub) {
  return `<nav class="library-breadcrumb" aria-label="Breadcrumb"><a href="/outputs.html">Research library</a><span aria-hidden="true">/</span>${isHub ? '' : '<a href="/topics/">Topic directory</a><span aria-hidden="true">/</span>'}<span aria-current="page">${esc(here)}</span></nav>`;
}
function directory() {
  return [...entries]
    .sort(([,a],[,b]) => a.label.localeCompare(b.label,'en'))
    .map(([slug,g]) => `          <li class="topic-entry"><a href="${groupPath(slug)}">${esc(g.label)}<span aria-hidden="true">→</span></a></li>`).join('\n');
}
function hub() {
  const summary='Browse all Acropolis health topics in one alphabetical directory. Find factsheets, reports, and publications by subject.';
  return wrap(null, 'Health Topics', summary, `      <section class="page-hero page-hero--outputs reading-hero">
        <div class="container">
          <h1 id="directory-title">Health Topics</h1>
          <p class="lede">Choose a topic to find its factsheets, reports, and publications.</p>
          <a class="button button-secondary" href="/outputs.html#browse">Search the Library</a>
        </div>
      </section>
      <div class="section section-compact" id="health-topics">
        <div class="container" id="conditions">
          <ul class="topic-directory-list" id="collections" aria-labelledby="directory-title">${'\n' + directory()}
          </ul>
        </div>
      </div>`);
}
function landing(slug,g) {
  const adjacent = slug === 'reproductive-health-stis' ? 'reproductive-early-life' :
    slug === 'reproductive-early-life' ? 'reproductive-health-stis' : null;
  const related = adjacent ? '<p>For related research, see <a href="' + groupPath(adjacent) +
    '">' + esc(groups[adjacent].label) + '</a>. A release about congenital syphilis, for example, may appear under both topics.</p>' : '';
  return wrap(slug,g.label,g.description,`      <section class="page-hero page-hero--outputs reading-hero">
        <div class="container">
          ${crumbs(g.label,false)}
          <span class="eyebrow">Health topic</span>
          <h1>${esc(g.label)}</h1>
          <p class="lede">${esc(g.description)}</p>
        </div>
      </section>
      <section class="section section-compact" id="releases" aria-labelledby="releases-title">
        <div class="container">
          <div class="topic-release-heading">
            <span class="eyebrow">Research library</span>
            <h2 id="releases-title">Factsheets, reports &amp; publications</h2>
          </div>
          <div data-library-list="group" data-group="${slug}"><p class="catalog-loading" role="status" hidden>Loading releases…</p></div>
          <noscript><p>Enable JavaScript to load the current release list, or <a href="/contact.html">contact the institute</a> for an accessible copy.</p></noscript>${related ? '\n          '+related : ''}
          <nav class="topic-next" aria-label="Explore the library"><a href="/topics/">Browse all topics</a><a href="/outputs.html#browse">Search all releases</a></nav>
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
