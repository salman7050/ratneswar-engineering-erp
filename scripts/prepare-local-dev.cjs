const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targets = [
  path.join(root, '.next'),
  path.join(root, 'tsconfig.tsbuildinfo'),
  path.join(root, 'node_modules', '.cache'),
];

for (const target of targets) {
  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 });
    console.log(`[local-dev] cleared ${path.relative(root, target)}`);
  } catch (error) {
    console.warn(`[local-dev] could not clear ${path.relative(root, target)}: ${error.message}`);
  }
}
