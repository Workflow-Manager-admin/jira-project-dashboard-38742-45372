import React, { useState, useEffect } from "react";

/**
 * PUBLIC_INTERFACE
 * JiraDashboard - Shows Jira projects for the authenticated user
 *
 * Props:
 *   authState: { email, domain, apiToken, authHeader }
 *   onLogout: function
 */
function JiraDashboard({ authState, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // PUBLIC_INTERFACE
  useEffect(() => {
    if (!authState) return;
    async function fetchProjects() {
      setLoading(true);
      setError('');
      try {
        const resp = await fetch(
          `https://${authState.domain}/rest/api/3/project/search?expand=lead,description,insight`,
          {
            headers: {
              Authorization: authState.authHeader,
              Accept: 'application/json'
            }
          }
        );
        if (!resp.ok) {
          throw new Error(
            resp.status === 401
              ? 'Session expired or invalid Jira credentials.'
              : `Failed to fetch projects. (Status ${resp.status})`
          );
        }
        const data = await resp.json();
        setProjects(data.values || []);
      } catch (err) {
        setError(err.message || 'Failed to load projects.');
      }
      setLoading(false);
    }
    fetchProjects();
  }, [authState]);

  if (loading) {
    return (
      <div className="dashboard-loader">
        <div className="spinner" /> Loading your Jira projects...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="form-error">{error}</div>
        <button className="btn" onClick={onLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Your Jira Projects</h2>
        <button className="btn logout-btn" onClick={onLogout}>Logout</button>
      </div>
      {projects.length === 0 ? (
        <div>No projects found for this account.</div>
      ) : (
        <div className="project-grid">
          {projects.map(project => (
            <div className="project-card" key={project.id}>
              <div className="project-avatar">
                {project.avatarUrls && project.avatarUrls['48x48'] && (
                  <img src={project.avatarUrls['48x48']} alt={`${project.name} avatar`} />
                )}
              </div>
              <div className="project-info">
                <div className="project-title">
                  {project.name}
                  <span className="project-key">{project.key}</span>
                </div>
                <div className="project-type">{project.projectTypeKey?.toUpperCase()}</div>
                <div className="project-lead">
                  Lead:&nbsp;
                  {project.lead?.displayName || 'N/A'} ({project.lead?.emailAddress || 'N/A'})
                </div>
                <div className="project-status">
                  <span>
                    Status: {project.archived ? 'Archived' : 'Active'}
                  </span>
                  <span className="project-updated">
                    Updated: {project.updated ? new Date(project.updated).toLocaleString() : 'n/a'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JiraDashboard;
