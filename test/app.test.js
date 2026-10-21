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

test('homepage identifies the remediated lab and supplies browser protection headers', async () => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Remediated training application/);
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(response.headers.get('content-security-policy'), /script-src 'none'/);
});

test('health endpoint identifies the remediated application', async () => {
  const response = await fetch(base + '/health');
  assert.deepEqual(await response.json(), { status: 'ok', mode: 'remediated-lab' });
});

test('search escapes executable markup and all HTML metacharacters', async () => {
  const payload = '<script>alert("lab")</script><img src=x onerror=alert(1)>&\'';
  const response = await fetch(base + '/search?q=' + encodeURIComponent(payload));
  const text = await response.text();
  assert.equal(response.status, 200);
  assert.match(text, /&lt;script&gt;/);
  assert.match(text, /&lt;img/);
  assert.match(text, /&quot;lab&quot;/);
  assert.match(text, /&amp;/);
  assert.match(text, /&#39;/);
  assert.doesNotMatch(text, /<script|<img/);
});

test('search supports ordinary text and a missing query', async () => {
  for (const suffix of ['/search?q=DevSecOps', '/search']) {
    assert.equal((await fetch(base + suffix)).status, 200);
  }
});

test('search rejects repeated parameters and oversized input', async () => {
  for (const suffix of ['/search?q=a&q=b', '/search?q=' + 'a'.repeat(513)]) {
    assert.equal((await fetch(base + suffix)).status, 400);
  }
});

test('download serves only the approved document as plain text', async () => {
  for (const suffix of ['/download', '/download?file=welcome.txt']) {
    const response = await fetch(base + suffix);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/plain/);
    assert.match(await response.text(), /Synthetic data/);
  }
});

test('download rejects traversal, absolute paths, double encoding and missing documents', async () => {
  for (const filename of ['../../package.json', '..\\..\\package.json', '/etc/passwd', 'C:\\Windows\\win.ini', '%2e%2e%2fpackage.json', 'missing.txt']) {
    const response = await fetch(base + '/download?file=' + encodeURIComponent(filename));
    assert.equal(response.status, 404, filename);
    assert.doesNotMatch(await response.text(), /"dependencies"/);
  }
});

test('download rejects repeated document parameters', async () => {
  assert.equal((await fetch(base + '/download?file=welcome.txt&file=other')).status, 400);
});

test('redirect allows only known constant local destinations', async () => {
  for (const target of ['/', '/api/topics']) {
    const response = await fetch(base + '/redirect?next=' + encodeURIComponent(target), { redirect: 'manual' });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), target);
  }
  const fallback = await fetch(base + '/redirect', { redirect: 'manual' });
  assert.equal(fallback.headers.get('location'), '/');
});

test('redirect rejects external, protocol-relative, encoded, script and ambiguous targets', async () => {
  for (const target of ['https://example.com', '//example.com', '\\\\example.com', 'javascript:alert(1)', '%2f%2fexample.com', '/unknown', ' /', '/\\example.com']) {
    const response = await fetch(base + '/redirect?next=' + encodeURIComponent(target), { redirect: 'manual' });
    assert.equal(response.status, 400, target);
    assert.equal(response.headers.get('location'), null);
  }
  assert.equal((await fetch(base + '/redirect?next=/&next=//example.com', { redirect: 'manual' })).status, 400);
});

test('topics remain sorted after replacing Lodash with native sorting', async () => {
  const response = await fetch(base + '/api/topics');
  assert.deepEqual(await response.json(), ['Containers', 'SAST', 'SCA', 'Secrets']);
});

test('repeated requests are rate limited with a retry interval', async () => {
  let throttled;
  for (let attempt = 0; attempt <= 60; attempt++) {
    const response = await fetch(base + '/health');
    if (response.status === 429) {
      throttled = response;
      break;
    }
    assert.equal(response.status, 200);
  }
  assert.ok(throttled, 'Expected the per-client request limit to reject a burst');
  assert.ok(Number(throttled.headers.get('retry-after')) > 0);
});
