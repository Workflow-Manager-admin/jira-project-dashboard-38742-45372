//
// PUBLIC_INTERFACE
// apiProxy.js - Node/Express serverless function (local dev server) for proxying Jira API authentication
//
// This file will be conditionally imported/run via 'react-scripts' setupProxy.js, and is for local dev use.
// On production, a similar pattern must exist on the production backend/server/api handler.
//
// NOTE: This file must be at the project root (not in src/)!

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));  // Polyfill for fetch

module.exports = function(app) {
  // Proxy POST /jira-authenticate to the real Jira API using provided domain and credentials in body
  app.post('/jira-authenticate', express.json(), async (req, res) => {
    const { email, domain, apiToken } = req.body;
    if (!email || !domain || !apiToken) {
      return res.status(400).json({ error: 'Missing credentials' });
    }
    const jiraDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const basicAuth = 'Basic ' + Buffer.from(`${email}:${apiToken}`).toString('base64');
    try {
      // Forward request securely to Jira
      const resp = await fetch(`https://${jiraDomain}/rest/api/3/myself`, {
        headers: {
          Authorization: basicAuth,
          Accept: 'application/json'
        }
      });
      const text = await resp.text(); // Jira may return error with details in body
      if (!resp.ok) {
        let errMsg = 'Authentication failed.';
        try { errMsg = JSON.parse(text).errorMessages?.[0] || errMsg; } catch (_) {}
        return res.status(resp.status).json({
          error: resp.status === 401
            ? 'Invalid credentials. Please check your email, domain, and API token.'
            : `Authentication failed (Status ${resp.status}): ${errMsg}`
        });
      }
      let userJson = {};
      try { userJson = JSON.parse(text); } catch (_) {}
      res.json({ ok: true, myself: userJson });
    } catch (err) {
      res.status(500).json({ error: 'Network error while connecting to Jira: ' + (err.message || String(err)) });
    }
  });
};
