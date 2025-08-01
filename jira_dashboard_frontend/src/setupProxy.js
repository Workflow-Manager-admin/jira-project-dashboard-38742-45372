//
// setupProxy.js - Register the Jira API authentication proxy middleware for local dev
//
const apiProxy = require('./apiProxy');
module.exports = function(app) {
  apiProxy(app);
};
