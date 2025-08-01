import React, { useState, useEffect } from 'react';
import './App.css';
import LoginForm from './LoginForm';
import JiraDashboard from './JiraDashboard';

// PUBLIC_INTERFACE
function App() {
  // Theme logic
  const [theme, setTheme] = useState('light');
  // Credential/auth state (do NOT hardcode anywhere)
  const [auth, setAuth] = useState(null);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  function handleLoginSuccess(authInfo) {
    setAuth(authInfo); // {email, domain, apiToken, authHeader, myself}
  }

  // PUBLIC_INTERFACE
  function handleLogout() {
    setAuth(null);
  }

  return (
    <div className="App">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
      {!auth ? (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      ) : (
        <JiraDashboard authState={auth} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
