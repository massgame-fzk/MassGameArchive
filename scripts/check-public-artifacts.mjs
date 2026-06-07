import fs from "node:fs";
import path from "node:path";

const publicDir = "public";
const blockedNames = new Set([".DS_Store", ".env", ".env.local", ".env.production", ".env.development"]);
const blockedExtensions = new Set([".key", ".pem", ".p12", ".pfx"]);
const findings = [];

function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(filePath);
      continue;
    }

    if (blockedNames.has(entry.name) || blockedExtensions.has(path.extname(entry.name))) {
      findings.push(filePath);
    }
  }
}

scan(publicDir);

if (findings.length > 0) {
  console.error("Public artifact check failed. Remove these files before building:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log("Public artifact check passed.");
