//
// setupProxy.js - Register the Jira API authentication proxy middleware for local dev
//
// Moved proxy logic out of src/ (frontend build folder); require from root instead.
const path = require('path');
const apiProxy = require(path.resolve(__dirname, '../apiProxy'));
module.exports = function(app) {
  apiProxy(app);
};
