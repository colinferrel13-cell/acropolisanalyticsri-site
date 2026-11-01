const assert = require('node:assert/strict');
const test = require('node:test');
const { select } = require('../assets/context-releases.js');

test('feature, service, and project/study views select only explicitly associated releases', () => {
  const items = [
    {id:'plain', date:'2026-10-31', title:'Unrelated release'},
    {id:'report', date:'2026-03-01', title:'Project report', services:['mapping'], project:'paeon'},
    {id:'finding', date:'2026-01-02', title:'Study summary', featured:true, services:['reporting'], study:'sample-study'},
  ];
  const ids = key => select(items,key).map(i=>i.id);
  assert.deepEqual(ids('featured'),['finding']);
  assert.deepEqual(ids('service:mapping'),['report']);
  assert.deepEqual(ids('service:surveys'),[]);
  assert.deepEqual(ids('paeon'),['report']);
  assert.deepEqual(ids('study:sample-study'),['finding']);
  assert.deepEqual(ids('study:no-such-study'),[]);
  assert.deepEqual(ids('study:paeon'),[]);
  assert.deepEqual(select([], 'featured'), []);
});
