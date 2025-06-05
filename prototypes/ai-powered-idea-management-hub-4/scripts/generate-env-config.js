// This script generates a config.js file that contains the environment variables
// that need to be available to the client-side code at runtime.
// It's specifically designed to work with environment variables that are
// usually set at build time in Vite (VITE_* variables).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to write the config file (in the public directory so it's copied to dist)
const targetPath = path.resolve(__dirname, '../public/config.js');

// Read environment files if they exist (check both .env and .env.local)
let envContent = '';
const envFiles = ['.env.local', '.env'];

for (const envFile of envFiles) {
  try {
    const content = fs.readFileSync(envFile, 'utf8');
    console.log(`Reading environment from ${envFile}`);
    envContent += content + '\n';
  } catch (err) {
    console.log(`No ${envFile} file found`);
  }
}

// Parse the environment variables from .env
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^(VITE_[A-Z0-9_]+)=(.*)$/);
  if (match) {
    const [, name, value] = match;
    envVars[name] = value;
  }
});

// Also include environment variables from process.env
Object.keys(process.env).forEach(key => {
  if (key.startsWith('VITE_')) {
    envVars[key] = process.env[key];
  }
});

// Generate the config file content
const configFileContent = `
// This file is auto-generated at build time
// DO NOT MODIFY MANUALLY
window.ENV = ${JSON.stringify(envVars, null, 2)};
`;

// Write the config file
fs.writeFileSync(targetPath, configFileContent);
console.log(`Environment config written to ${targetPath}`);
