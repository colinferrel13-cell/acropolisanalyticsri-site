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

test('each printed URL resolves to its own landing, code pair, and catalog scope', () => {
  const hub = fs.readFileSync(path.join(home,'topics/index.html'),'utf8');
  for(const slug of printed) assert.ok(Object.hasOwn(groups,slug),slug+' must remain a destination');
  for(const [slug,g] of Object.entries(groups)) {
    const route = '/topics/'+slug+'/', url = 'https://acropolisanalyticsri.com'+route;
    assert.equal(groupURL(slug),route);
    assert.match(hub,new RegExp('href="'+route+'"'));
    const page = fs.readFileSync(path.join(home,'topics',slug,'index.html'),'utf8');
    assert.ok(page.includes('href="'+url+'"') && page.includes('data-group="'+slug+'"'),slug);
    assert.equal((g.kind==='topic'?topics:collections)[slug],g.label);
    for (const ext of ['png','svg']) {
      const filename=slug+'.'+ext;
      assert.ok(page.includes('/assets/qr/'+filename),filename);
      const bytes=fs.readFileSync(path.join(home,'assets/qr',filename));
      if(ext==='png') assert.ok(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
      else assert.ok(bytes.toString('utf8').includes(url+'</title>'),filename);
    }
  }
  assert.ok(hub.includes('href="/assets/qr/acropolis-topic-qr.zip"'));
  assert.equal(topicURL('population-health'),'/outputs.html?topic=population-health');
});

test('program collections are independent of type, topic, and educational series', () => {
  const entry={id:'example',title:'Sample',summary:'Test only.',authors:'Example',type:'publication',
    url:'https://example.org/paper',files:[],date:'2026-01-01',collections:['psa','agriculture']};
  const check=item=>validate({version:1,items:[item]});
  assert.deepEqual(check(entry),[]);
  assert.deepEqual(check({...entry,topics:['injuries-exposures','respiratory-health']}),[]);
  assert.match(searchText(entry),/public service announcements/);
  assert.match(searchText(entry),/agriculture/);
  for(const invalid of [{collections:['psa','psa']},{collections:['cancer']},{topics:['psa']},{collections:'psa'}])
    assert.notDeepEqual(check({...entry,...invalid}),[]);
});
