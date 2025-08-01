import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import LoginForm from './LoginForm';
import JiraDashboard from './JiraDashboard';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Export for testing/expansion
export { App, LoginForm, JiraDashboard };
