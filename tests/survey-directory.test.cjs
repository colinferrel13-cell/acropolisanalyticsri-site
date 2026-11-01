const assert = require('node:assert/strict');
const test = require('node:test');
const {existsSync, readFileSync} = require('node:fs');
const path = require('node:path');
const {groupStudies} = require('../assets/surveys.js');

const fixture = {id: 'directory-test', title: 'Test study', audience: 'Test audience.',
  summary: 'A test record that is never published in the registry.', status: 'development'};
const catalog = (...studies) => ({version: 1, studies});

test('open route leads to study information before a questionnaire; other states never invite a response', () => {
  const states = ['open','development','paused','closed'];
  const grouped = groupStudies(catalog(...states.map(status => ({...fixture, id: 'test-' + status, status, duration: '10 minutes'}))));
  assert.equal(grouped.open.length, 1);
  assert.equal(grouped.open[0].href, 'surveys/test-open/');
  assert.match(grouped.open[0].action, /eligibility/);
  assert.match(grouped.development[0].badge, /not recruiting/);
  assert.deepEqual(grouped.archive.map(study => study.status), ['paused','closed']);
  grouped.archive.forEach(study => assert.match(study.badge, /not accepting/));
});

test('an empty registry is valid, unlike a broken or unsafe one', () => {
  assert.deepEqual(groupStudies(catalog()), {open: [], development: [], archive: []});
  for (const input of [null, [], {}, {version: 2, studies: []}, catalog(fixture, fixture),
    catalog({...fixture, status: 'active'}), catalog({...fixture, status: 'open'}),
    catalog({...fixture, id:'../other'}), catalog({...fixture, id:'//untrusted.invalid'}),
    catalog({...fixture, url:'https://untrusted.invalid'}), catalog({...fixture, title: ''})]) {
    assert.throws(() => groupStudies(input));
  }
});

test('the shipped directory validates and every study has a permanent landing page', () => {
  const registry = JSON.parse(readFileSync(path.join(__dirname,'../surveys/registry.json'), 'utf8'));
  for (const study of Object.values(groupStudies(registry)).flat()) {
    assert.ok(existsSync(path.join(__dirname,'..',study.href,'index.html')), study.href);
  }
});
