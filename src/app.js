'use strict';
// INTENTIONALLY VULNERABLE. Use only in an isolated local lab.
const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const _ = require('lodash');
const app = express();

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/health', (req, res) => res.json({ status: 'ok', mode: 'vulnerable-lab' }));

// CWE-79: user input is rendered as HTML without escaping.
app.get('/search', (req, res) => {
  const query = req.query.q || '';
  res.send('<h1>Results</h1><p>You searched for: ' + query + '</p><a href="/">Back</a>');
});

// CWE-22: user input can escape the intended documents directory.
app.get('/download', (req, res) => {
  const filename = req.query.file || 'welcome.txt';
  const documentPath = path.join(__dirname, 'documents', filename);
  fs.readFile(documentPath, 'utf8', (error, content) => {
    if (error) return res.status(404).send('Document not found');
    res.type('text/plain').send(content);
  });
});

// CWE-601: an untrusted destination is used without an allowlist.
app.get('/redirect', (req, res) => {
  res.redirect(req.query.next || '/');
});

// A deliberately old lodash version makes SCA findings reproducible.
app.get('/api/topics', (req, res) => res.json(_.sortBy(['SAST', 'Secrets', 'SCA', 'Containers'])));
module.exports = app;
