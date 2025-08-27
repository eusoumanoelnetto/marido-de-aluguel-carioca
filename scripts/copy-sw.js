const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'sw.js');
const destDir = path.resolve(__dirname, '..', 'dist');
const dest = path.join(destDir, 'sw.js');

if (!fs.existsSync(src)) {
  console.error('sw.js not found at', src);
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  console.error('dist directory not found at', destDir, '- run build first');
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log('Copied sw.js to', dest);
