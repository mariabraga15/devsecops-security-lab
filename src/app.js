'use strict';
// Remediated training application. Keep the lab bound to localhost.
const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const escapeHtml = require('escape-html');
const { rateLimit } = require('express-rate-limit');
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': "default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  });
  next();
});
// Bound repeated requests before filesystem reads or other route handlers.
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false
}));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/health', (req, res) => res.json({ status: 'ok', mode: 'remediated-lab' }));

// CWE-79 remediation: validate input and escape it for an HTML text context.
app.get('/search', (req, res) => {
  const query = req.query.q === undefined ? '' : req.query.q;
  if (typeof query !== 'string' || query.length > 512) {
    return res.status(400).send('Search term must be a string of at most 512 characters');
  }
  res.send('<h1>Results</h1><p>You searched for: ' + escapeHtml(query) + '</p><a href="/">Back</a>');
});

// CWE-22 remediation: only a known document is exposed; the filesystem path is fixed.
app.get('/download', (req, res) => {
  const filename = req.query.file === undefined ? 'welcome.txt' : req.query.file;
  if (typeof filename !== 'string') return res.status(400).send('Invalid document name');
  if (filename !== 'welcome.txt') return res.status(404).send('Document not found');
  const documentPath = path.join(__dirname, 'documents', 'welcome.txt');
  fs.readFile(documentPath, 'utf8', (error, content) => {
    if (error) return res.status(404).send('Document not found');
    res.type('text/plain').send(content);
  });
});

// CWE-601 remediation: select a constant destination from an explicit allowlist.
app.get('/redirect', (req, res) => {
  const destination = req.query.next === undefined ? '/' : req.query.next;
  if (destination === '/') return res.redirect('/');
  if (destination === '/api/topics') return res.redirect('/api/topics');
  return res.status(400).send('Redirect destination is not allowed');
});

// Native sorting replaces the unused vulnerable Lodash dependency.
app.get('/api/topics', (req, res) => res.json(['SAST', 'Secrets', 'SCA', 'Containers'].sort()));
module.exports = app;
