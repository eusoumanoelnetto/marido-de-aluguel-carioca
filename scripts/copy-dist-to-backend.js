const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'dist');
const dest = path.resolve(__dirname, '..', 'backend', 'dist');

function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.error('source not found:', srcDir);
    process.exit(1);
  }
  fs.mkdirSync(destDir, { recursive: true });
  const items = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const item of items) {
    const s = path.join(srcDir, item.name);
    const d = path.join(destDir, item.name);
    if (item.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

try {
  copyRecursive(src, dest);
  console.log('copied dist -> backend/dist');
} catch (err) {
  console.error('copy failed', err);
  process.exit(1);
}
