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
  const [errorDetails, setErrorDetails] = useState(null);

  // PUBLIC_INTERFACE
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrorDetails(null);

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
      let text = '';
      let isJson = true;

      try {
        text = await resp.text();
        try {
          body = JSON.parse(text);
        } catch {
          body = { raw: text };
          isJson = false;
        }
      } catch {
        body = {};
        isJson = false;
      }

      if (!resp.ok) {
        // Build enhanced error message object
        let errMsg = body && body.error
          ? body.error
          : (isJson ? "Network or authentication error" : "Unexpected response format");

        // Attach detailed diagnostics
        setError(
          `Login failed: ${errMsg}` +
          (resp.status ? ` (HTTP ${resp.status} ${resp.statusText})` : "")
        );

        setErrorDetails({
          networkError: false,
          httpStatus: resp.status,
          statusText: resp.statusText,
          headers: Object.fromEntries(resp.headers.entries ? resp.headers.entries() : []),
          body: text && text.length < 2048 ? text : "(Body too large to show)",
          jsonData: isJson ? body : null
        });
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
      // Network or JS error, possibly 'Failed to fetch' (CORS, proxy, server down, offline, DNS...)
      setError(
        "Failed to connect to backend or network error. " +
        (err && err.message ? `(${err.message})` : "")
      );
      setErrorDetails({
        networkError: true,
        message: err && err.message,
        name: err && err.name,
        stack: err && err.stack,
        diag: (err && typeof err === "object") ? JSON.stringify(err, Object.getOwnPropertyNames(err), 2) : String(err)
      });
    }

    setLoading(false);
  }

  function renderErrorDetails() {
    if (!errorDetails) return null;

    if (errorDetails.networkError) {
      // Network-level error (not HTTP response)
      return (
        <details style={{ marginTop: '0.5em', color: "#B12D01", fontSize: '0.97em', background: '#fff5f3', border: "1px solid #ffcccc", borderRadius: 3, padding: '0.5em 1em' }}>
          <summary style={{cursor: "pointer"}}>Show network error diagnostic</summary>
          <div><b>Error Name:</b> {errorDetails.name || "(n/a)"}</div>
          <div><b>Message:</b> {errorDetails.message || "(no message)"}</div>
          {errorDetails.stack && (
            <pre style={{color: '#824f00', background: "#fff8ea", whiteSpace:'pre-wrap'}}>{errorDetails.stack}</pre>
          )}
          <div style={{marginTop:'0.5em'}}><b>Raw Diagnostic:</b></div>
          {errorDetails.diag && <pre style={{ color: "#5a1b09", fontSize: '0.90em', background: "#fffbe7", whiteSpace:'pre-wrap' }}>{errorDetails.diag}</pre>}
        </details>
      );
    } else {
      // HTTP or server-side error
      return (
        <details style={{ marginTop: '0.6em', color: "#b15600", fontSize: '0.96em', background: '#fff9ed', border: "1px solid #ffe0b8", borderRadius: 3, padding: '0.5em 1em' }}>
          <summary style={{cursor:"pointer"}}>Show HTTP/server error log details</summary>
          <div><b>HTTP Status:</b> {errorDetails.httpStatus} {errorDetails.statusText || ""}</div>
          {errorDetails.headers &&
            <div style={{marginTop:'0.2em'}}><b>Headers:</b>
              <pre style={{ color: "#946500", fontSize: '0.93em' }}>{JSON.stringify(errorDetails.headers, null, 2)}</pre>
            </div>
          }
          {errorDetails.body && <div><b>Body:</b>
            <pre style={{ color: "#914f00", fontSize: '0.92em', background:'#fff7e0' }}>{errorDetails.body}</pre>
          </div>}
          {errorDetails.jsonData && (
            <div style={{marginTop:'0.3em'}}><b>JSON Data:</b>
              <pre style={{ color: "#566300", fontSize: '0.93em',  background: '#fff7ee' }}>{JSON.stringify(errorDetails.jsonData, null, 2)}</pre>
            </div>
          )}
        </details>
      );
    }
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
        {renderErrorDetails()}
      </form>
    </div>
  );
}

export default LoginForm;
