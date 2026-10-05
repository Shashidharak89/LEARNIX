const fs = require('fs');
const path = require('path');

const targetPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'next',
  'dist',
  'compiled',
  'browserslist',
  'index.js'
);

if (fs.existsSync(targetPath)) {
  let content = fs.readFileSync(targetPath, 'utf8');
  const targetPattern = /\d+<\(new Date\)\.setMonth\(\(new Date\)\.getMonth\(\)-2\)&&console\.warn\("\[baseline-browser-mapping][^"]+"\);?/g;

  if (targetPattern.test(content)) {
    content = content.replace(
      targetPattern,
      '/* suppressed baseline-browser-mapping warning */'
    );
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('[suppress-baseline-warning] Successfully patched Next.js browserslist bundle.');
  }
}
