// tools/find-login-redirects.mjs
// Scan the repo for any redirect logic that points to login or uses window.location

import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.vercel',
  '.netlify'
]);

// Patterns we care about (possible redirect logic)
const PATTERNS = [
  /login\.html/i,
  /\/login['"]/i,
  /window\.location\.href/i,
  /location\.assign\s*\(/i,
  /location\.replace\s*\(/i
];

// File extensions to scan
const EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.html']);

function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return EXTENSIONS.has(ext);
}

function shouldIgnoreDir(dirName) {
  return IGNORE_DIRS.has(dirName);
}

async function walk(dir, results = []) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!shouldIgnoreDir(entry.name)) {
        await walk(fullPath, results);
      }
    } else if (entry.isFile() && shouldScanFile(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

async function scanFile(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const matches = [];

  lines.forEach((line, index) => {
    PATTERNS.forEach((re) => {
      if (re.test(line)) {
        matches.push({
          lineNumber: index + 1,
          line: line.trim(),
          pattern: re.toString()
        });
      }
    });
  });

  return matches;
}

async function main() {
  console.log(`Scanning for login redirects in ${ROOT_DIR}...\n`);

  const files = await walk(ROOT_DIR);
  let totalMatches = 0;

  for (const file of files) {
    const matches = await scanFile(file);
    if (matches.length > 0) {
      console.log(`\n=== ${file} ===`);
      matches.forEach((m) => {
        totalMatches++;
        console.log(
          `  [${m.lineNumber}] (${m.pattern}) ${m.line}`
        );
      });
    }
  }

  console.log(`\nScan complete. Found ${totalMatches} potential redirect lines.`);
}

main().catch((err) => {
  console.error('Error while scanning:', err);
  process.exit(1);
});
