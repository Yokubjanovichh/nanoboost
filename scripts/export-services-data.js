#!/usr/bin/env node
// Exports window.NB_SERVICE_CONFIG from services-data.js to JSON on stdout.
//
// Usage:
//   node scripts/export-services-data.js > /tmp/services-data.json
//
// services-data.js is a browser-side IIFE that assigns to `window.*`.
// We stub `window` here so the same file can be require()'d in Node.

const path = require("node:path");

// services-data.js also reads window.NB_API_URL via destructuring etc.
global.window = {};

require(path.resolve(__dirname, "..", "archive", "services-data.js"));

const config = global.window.NB_SERVICE_CONFIG;

if (!config || typeof config !== "object") {
  console.error("Error: window.NB_SERVICE_CONFIG was not populated");
  process.exit(1);
}

process.stdout.write(JSON.stringify(config, null, 2) + "\n");
