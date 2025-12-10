const express = require('express');
const { marked } = require('marked');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(express.static('public'));

const readMarkdownFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
};

const wrapHtml = (content, title) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - VitalTrack Documentation</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6; 
      color: #333;
      background: #f5f5f5;
    }
    nav {
      background: #1a73e8;
      color: white;
      padding: 1rem 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    nav h1 { font-size: 1.5rem; display: inline-block; }
    nav a { color: white; text-decoration: none; margin-left: 2rem; }
    nav a:hover { text-decoration: underline; }
    .container { max-width: 900px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1, h2, h3, h4 { margin-top: 1.5rem; margin-bottom: 0.5rem; color: #1a73e8; }
    h1 { font-size: 2rem; border-bottom: 2px solid #1a73e8; padding-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    p { margin: 1rem 0; }
    a { color: #1a73e8; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
    pre { background: #2d2d2d; color: #f8f8f2; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 1rem 0; }
    pre code { background: none; color: inherit; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
    th { background: #f4f4f4; font-weight: 600; }
    tr:nth-child(even) { background: #fafafa; }
    ul, ol { margin: 1rem 0; padding-left: 2rem; }
    li { margin: 0.5rem 0; }
    blockquote { border-left: 4px solid #1a73e8; margin: 1rem 0; padding-left: 1rem; color: #666; }
    .doc-list { list-style: none; padding: 0; }
    .doc-list li { margin: 0.5rem 0; padding: 1rem; background: #f9f9f9; border-radius: 4px; border-left: 4px solid #1a73e8; }
    .doc-list a { text-decoration: none; font-weight: 500; }
    .doc-list a:hover { text-decoration: underline; }
    .doc-list .desc { color: #666; font-size: 0.9rem; margin-top: 0.25rem; }
  </style>
</head>
<body>
  <nav>
    <h1>VitalTrack</h1>
    <a href="/">Home</a>
    <a href="/docs/api">API Spec</a>
    <a href="/docs/development">Development</a>
    <a href="/docs/security">Security</a>
    <a href="/docs/ui">UI Spec</a>
  </nav>
  <div class="container">
    ${content}
  </div>
</body>
</html>
`;

app.get('/', (req, res) => {
  const readme = readMarkdownFile('./README.md');
  if (readme) {
    res.send(wrapHtml(marked(readme), 'Home'));
  } else {
    res.send(wrapHtml('<h1>VitalTrack Documentation</h1><p>Welcome to VitalTrack - Real-time health monitoring for senior care facilities.</p>', 'Home'));
  }
});

app.get('/docs/api', (req, res) => {
  const content = readMarkdownFile('./docs/core-specs/API_SPEC.md');
  if (content) {
    res.send(wrapHtml(marked(content), 'API Specification'));
  } else {
    res.status(404).send(wrapHtml('<h1>Not Found</h1>', '404'));
  }
});

app.get('/docs/development', (req, res) => {
  const content = readMarkdownFile('./docs/core-specs/DEVELOPMENT_PHASES.md');
  if (content) {
    res.send(wrapHtml(marked(content), 'Development Phases'));
  } else {
    res.status(404).send(wrapHtml('<h1>Not Found</h1>', '404'));
  }
});

app.get('/docs/security', (req, res) => {
  const content = readMarkdownFile('./docs/core-specs/SECURITY.md');
  if (content) {
    res.send(wrapHtml(marked(content), 'Security'));
  } else {
    res.status(404).send(wrapHtml('<h1>Not Found</h1>', '404'));
  }
});

app.get('/docs/ui', (req, res) => {
  const content = readMarkdownFile('./docs/core-specs/UI_SPEC.md');
  if (content) {
    res.send(wrapHtml(marked(content), 'UI Specification'));
  } else {
    res.status(404).send(wrapHtml('<h1>Not Found</h1>', '404'));
  }
});

app.get('/docs/hipaa', (req, res) => {
  const content = readMarkdownFile('./docs/core-specs/HIPAA_COMPLIANCE_CHECKLIST.md');
  if (content) {
    res.send(wrapHtml(marked(content), 'HIPAA Compliance'));
  } else {
    res.status(404).send(wrapHtml('<h1>Not Found</h1>', '404'));
  }
});

app.get('/docs/deployment', (req, res) => {
  const content = readMarkdownFile('./docs/core-specs/DEPLOYMENT_GUIDE.md');
  if (content) {
    res.send(wrapHtml(marked(content), 'Deployment Guide'));
  } else {
    res.status(404).send(wrapHtml('<h1>Not Found</h1>', '404'));
  }
});

app.get('/docs/workflow', (req, res) => {
  const content = readMarkdownFile('./docs/core-specs/REPLIT_WORKFLOW.md');
  if (content) {
    res.send(wrapHtml(marked(content), 'Replit Workflow'));
  } else {
    res.status(404).send(wrapHtml('<h1>Not Found</h1>', '404'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VitalTrack Documentation Server running at http://0.0.0.0:${PORT}`);
});
