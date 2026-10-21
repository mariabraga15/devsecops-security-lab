'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
let server, base;
before(async () => {
  server = await new Promise(resolve => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
test('homepage identifies the vulnerable local lab', async () => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Intentionally vulnerable application/);
});
test('health endpoint responds', async () => {
  assert.equal((await (await fetch(base + '/health')).json()).status, 'ok');
});
// Baseline characterization tests: replace these with rejection/escaping tests when fixing the lab.
test('baseline: reflected HTML is preserved', async () => {
  const response = await fetch(base + '/search?q=' + encodeURIComponent('<b>lab</b>'));
  assert.match(await response.text(), /<b>lab<\/b>/);
});
test('baseline: traversal can read the application package manifest', async () => {
  const response = await fetch(base + '/download?file=' + encodeURIComponent('../../package.json'));
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(await response.text()).name, 'devsecops-security-lab');
});
test('baseline: external redirect is accepted', async () => {
  const response = await fetch(base + '/redirect?next=https://example.com', { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://example.com');
});
test('missing document returns 404', async () => {
  assert.equal((await fetch(base + '/download?file=missing.txt')).status, 404);
});
