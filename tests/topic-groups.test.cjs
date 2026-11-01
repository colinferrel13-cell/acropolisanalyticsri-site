'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {validate, groups, topics, collections, searchText, topicURL, groupURL} = require('../assets/library-schema.js');
const home = path.join(__dirname,'..');
// These slugs are printed on paper. Keep these destinations even if groups are added or renamed.
const printed = ['cardiovascular-disease','metabolic-health','respiratory-health','cancer','brain-nerves-senses',
  'mental-health','infectious-disease','digestive-liver-oral','bones-joints-immune','reproductive-early-life','injuries-exposures','psa','agriculture'];

test('each permanent URL remains in the directory and has its own landing and catalog scope', () => {
  const hub = fs.readFileSync(path.join(home,'topics/index.html'),'utf8');
  for(const slug of printed) assert.ok(Object.hasOwn(groups,slug),slug+' must remain a destination');
  for(const [slug,g] of Object.entries(groups)) {
    const route = '/topics/'+slug+'/', url = 'https://acropolisanalyticsri.com'+route;
    assert.equal(groupURL(slug),route);
    assert.match(hub,new RegExp('href="'+route+'"'));
    const page = fs.readFileSync(path.join(home,'topics',slug,'index.html'),'utf8');
    assert.ok(page.includes('href="'+url+'"') && page.includes('data-group="'+slug+'"'),slug);
    assert.equal((g.kind==='topic'?topics:collections)[slug],g.label);
  }
  assert.equal(topicURL('population-health'),'/outputs.html?topic=population-health');
});

test('public web pages and assets do not distribute the private QR artwork or kit', () => {
  function filesUnder(folder) {
    return fs.readdirSync(folder, {withFileTypes:true})
      .filter(e=>!['.git','node_modules'].includes(e.name))
      .flatMap(e=>e.isDirectory()?filesUnder(path.join(folder,e.name)):[path.join(folder,e.name)]);
  }
  const files=filesUnder(home);
  for(const file of files) {
    const relative=path.relative(home,file).split(path.sep).join('/');
    assert.doesNotMatch(relative,/^assets\/qr\/|(?:^|\/)[^/]*\bqr\b[^/]*\.(?:svg|png|zip|pdf)$/i);
    if(/\.html?$/.test(file)) {
      const page=fs.readFileSync(file,'utf8');
      assert.doesNotMatch(page,/\/assets\/qr\/|\bQR\s+(?:codes?|images?|kit|downloads?)\b/i,relative);
    }
    if(relative==='assets/publisher.js') assert.doesNotMatch(fs.readFileSync(file,'utf8'),/\/assets\/qr\//,relative);
  }
});

test('program collections are independent of type, topic, and educational series', () => {
  const entry={id:'example',title:'Sample',summary:'Test only.',authors:'Example',type:'publication',
    url:'https://example.org/paper',files:[],date:'2026-01-01',collections:['psa','agriculture']};
  const check=item=>validate({version:1,items:[item]});
  assert.deepEqual(check(entry),[]);
  assert.deepEqual(check({...entry,topics:['injuries-exposures','respiratory-health']}),[]);
  for(const id of entry.collections) assert.ok(searchText(entry).includes(collections[id].toLowerCase()));
  for(const invalid of [{collections:['psa','psa']},{collections:['cancer']},{topics:['psa']},{collections:'psa'}])
    assert.notDeepEqual(check({...entry,...invalid}),[]);
});
