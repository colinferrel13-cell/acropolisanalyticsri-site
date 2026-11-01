// Structural checks for the delivered static site. No network, browser, or packages required.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const origin = 'https://' + fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim();
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
function inventory(folder = '') {
  const names = [];
  for (const entry of fs.readdirSync(path.join(root, folder), {withFileTypes: true})) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const name = path.posix.join(folder, entry.name);
    if (entry.isDirectory()) names.push(...inventory(name)); else names.push(name);
  }
  return names;
}
const files = new Set(inventory()); // Exact spelling, including on case-insensitive file systems.
function decode(s) {
  return s.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'");
}
// Only inspect tag attributes, never code, JSON-LD, style declarations, or HTML comments.
function tags(html) {
  const clean = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<(script|style)\b[^>]*>)[\s\S]*?<\/\2\s*>/gi, '$1');
  return [...clean.matchAll(/<([a-z][\w:-]*)\b((?:[^"'<>]|"[^"]*"|'[^']*')*)>/gi)].map(match => {
    const attrs = Object.create(null);
    for (const m of match[2].matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))
      attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4]);
    return {tag: match[1].toLowerCase(), attrs};
  });
}
const pages = new Map([...files].filter(name => /\.html?$/i.test(name)).map(name => {
  const html = read(name);
  return [name, {html, tags: tags(html)}];
}));
function pageURL(name) { return new URL('/' + name.replace(/(^|\/)index\.html$/, '$1'), origin); }
function fileOf(url) {
  const rel = decodeURIComponent(url.pathname.slice(1));
  return !rel || rel.endsWith('/') ? rel + 'index.html' : rel;
}
function problems(errors) { assert.equal(errors.length, 0, errors.join('\n')); }
function hasLink(html, from, target) {
  return tags(html).some(({tag,attrs}) =>
    tag === 'a' && attrs.href && new URL(attrs.href, pageURL(from)).href === pageURL(target).href);
}

test('static pages have a single heading, unique IDs, existing local links/assets and ARIA references', () => {
  const errors = [];
  for (const [name, page] of pages) {
    const localIds = page.tags.map(t => t.attrs.id).filter(Boolean), idSet = new Set(localIds);
    if (localIds.length !== idSet.size) errors.push(name + ': duplicate id');
    if (page.tags.filter(t => t.tag === 'h1').length !== 1) errors.push(name + ': expected one h1');
    for (const {attrs} of page.tags) {
      for (const key of ['aria-controls','aria-labelledby','aria-describedby','for']) {
        if (attrs[key]) for (const id of attrs[key].split(/\s+/).filter(Boolean))
          if (!idSet.has(id)) errors.push(name + ': missing ' + key + ' target #' + id);
      }
      for (const key of ['href','src']) {
        if (attrs[key] === undefined) continue;
        if (!attrs[key].trim()) { errors.push(name + ': empty ' + key); continue; }
        const target = new URL(attrs[key], pageURL(name));
        if (target.origin !== origin) continue;
        const dest = fileOf(target);
        if (!files.has(dest)) { errors.push(name + ': missing ' + dest); continue; }
        if (target.hash && pages.has(dest)) {
          const id = decodeURIComponent(target.hash.slice(1));
          if (!pages.get(dest).tags.some(t => t.attrs.id === id))
            errors.push(name + ': missing anchor ' + dest + '#' + id);
        }
      }
    }
  }
  problems(errors);
});

test('indexable pages have matching canonical URLs and sitemap entries', () => {
  const excluded = new Set(['release.html','manage-publications.html','404.html','data.html']);
  const urls = [...read('sitemap.xml').matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(m => decode(m[1]));
  const present = new Set(urls);
  const errors = [];
  if (present.size !== urls.length) errors.push('Duplicate sitemap URL');
  for (const [name,page] of pages) {
    if (excluded.has(name)) {
      if (present.has(pageURL(name).href)) errors.push(name + ' should not be indexed as a standalone destination');
      continue;
    }
    const expected = pageURL(name).href;
    const canonical = page.tags.filter(t => t.tag === 'link' && t.attrs.rel?.toLowerCase() === 'canonical');
    if (canonical.length !== 1 || canonical[0].attrs.href !== expected) errors.push(name + ': expected canonical ' + expected);
    if (!present.has(expected)) errors.push(name + ': missing from sitemap');
  }
  for (const url of present) {
    const target = new URL(url);
    if (target.origin !== origin || target.hash || !files.has(fileOf(target))) errors.push('Invalid sitemap URL: ' + url);
  }
  problems(errors);
});

test('homepage visitor routes and research index lead directly to public destinations', () => {
  const home = pages.get('index.html').html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '';
  for (const dest of ['projects.html','participate.html','services.html','outputs.html'])
    assert.ok(hasLink(home,'index.html',dest), 'Missing homepage route to ' + dest);
  const research = pages.get('projects.html').html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '';
  for (const dest of ['paeon.html','surveys/adrd-caregiver/index.html','methods.html'])
    assert.ok(hasLink(research,'projects.html',dest), 'Missing research route to ' + dest);
  assert.ok(hasLink(pages.get('about.html').html,'about.html','colin-ferrel.html'), 'Academic profile must be discoverable');
});

test('shared page footers link to methods and privacy, and reading pages mark their location', () => {
  for (const [name,page] of pages) {
    if (!page.tags.some(t => t.attrs.id === 'primary-navigation')) continue; // standalone redirect / error page
    const footer = page.html.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] || '';
    for (const target of ['methods.html','privacy.html'])
      assert.ok(hasLink(footer,name,target), name + ': footer needs ' + target);
  }
  for (const [name,target] of Object.entries({'paeon.html':'projects.html','colin-ferrel.html':'about.html','methods.html':'methods.html'})) {
    assert.ok(pages.get(name).tags.some(t => t.tag === 'a' && t.attrs.href &&
      ['page','location'].includes(t.attrs['aria-current']) && new URL(t.attrs.href,pageURL(name)).href === pageURL(target).href),
      name + ': current page or section is not indicated');
  }
});

test('no PDF can be exposed outside the reviewed publication inventory', () => {
  // This is an inventory boundary, not an inference that a PDF was reviewed or redacted.
  // An actual approved PDF is allowed as soon as it has a matching release record.
  const {items} = JSON.parse(read('library/catalog.json'));
  const approved = new Set(items.flatMap(item => item.files.map(f => 'library/' + f.name)));
  const pdfs = [...files].filter(name => /\.pdf$/i.test(name));
  assert.deepEqual(pdfs.sort(), [...approved].sort(), 'Public PDFs and listed publication files differ');
});
