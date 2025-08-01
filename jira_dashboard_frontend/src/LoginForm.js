import React, { useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * LoginForm - Secure form for Jira authentication
 *
 * Props:
 *   onLoginSuccess (function): Callback with { email, domain, apiToken, authHeader } on success
 */
function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // PUBLIC_INTERFACE
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Basic validation
    if (!email.trim() || !domain.trim() || !apiToken.trim()) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    // Use backend proxy to avoid CORS and secure credential handling
    try {
      const resp = await fetch('/jira-authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, domain, apiToken }),
      });
      let body, userJson = undefined;
      try { body = await resp.json(); } catch { body = {}; }
      if (!resp.ok) {
        // Show precise message if available
        setError(body && body.error
          ? body.error
          : `Network or authentication error (status ${resp.status}).`);
        setLoading(false);
        return;
      }
      userJson = body.myself;
      onLoginSuccess({
        email,
        domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        apiToken,
        authHeader: 'Basic ' + btoa(`${email}:${apiToken}`),
        myself: userJson
      });
    } catch (err) {
      setError('Failed to connect to server. Please check your network or try again.');
    }
    setLoading(false);
  }

  return (
    <div className="login-form-wrapper">
      <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
        <h2>Sign in to Jira Dashboard</h2>
        <div className="input-group">
          <label htmlFor="jira-email">Jira Email</label>
          <input
            id="jira-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="jira-domain">Jira Domain</label>
          <input
            id="jira-domain"
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="your-domain.atlassian.net"
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="jira-token">API Token</label>
          <input
            id="jira-token"
            type="password"
            autoComplete="current-password"
            value={apiToken}
            onChange={e => setApiToken(e.target.value)}
            placeholder="Jira API Token"
            required
          />
          <small>
            <a href="https://id.atlassian.com/manage/api-tokens" target="_blank" rel="noopener noreferrer">
              Get your Jira API token
            </a>
          </small>
        </div>
        <button className="btn login-btn" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        {error && <div className="form-error">{error}</div>}
      </form>
    </div>
  );
}

export default LoginForm;
