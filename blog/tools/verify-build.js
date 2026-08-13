'use strict';

/**
 * Pre-deploy sanity check.
 *
 * `hexo deploy` does not build anything -- it pushes whatever is sitting in
 * public/ to the gh-pages branch. So whatever public/ contains becomes the
 * live site, including nothing at all.
 *
 * That is a real hazard here, because this old stack silently produces broken
 * output on modern Node unless tools/node-compat.js is loaded (see the notes
 * in that file). Running `npx hexo generate` instead of `npm run build`
 * bypasses the shim and yields a public/ with zero HTML pages -- deploying
 * that would wipe every page on the site.
 *
 * Wired up as `predeploy` in package.json, so `npm run deploy` refuses to
 * push a build that looks broken.
 */

const fs = require('fs');
const path = require('path');

const siteDir = path.join(__dirname, '..');
const publicDir = path.join(siteDir, 'public');
const postsDir = path.join(siteDir, 'source', '_posts');

const errors = [];
const warnings = [];

function walk(dir, filter) {
  const found = [];
  (function recurse(d) {
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch (err) {
      return;
    }
    for (const entry of entries) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) recurse(full);
      else if (filter(entry.name)) found.push(full);
    }
  }(dir));
  return found;
}

// 1. public/ has to exist at all.
if (!fs.existsSync(publicDir)) {
  errors.push('public/ does not exist -- run `npm run build` first.');
} else {
  const htmlFiles = walk(publicDir, n => n.endsWith('.html'));

  // 2. Any 0-byte page means the CacheStream bug got through.
  const empty = htmlFiles.filter(f => fs.statSync(f).size === 0);
  if (empty.length) {
    errors.push(
      `${empty.length} generated HTML file(s) are 0 bytes:\n` +
      empty.slice(0, 5).map(f => '      ' + path.relative(publicDir, f)).join('\n') +
      '\n    Either a template failed to render (scroll up for a Render HTML failed\n' +
      '    error), or the build bypassed tools/node-compat.js -- see that file.'
    );
  }

  // 3. Every post should have produced at least one page.
  const postCount = fs.existsSync(postsDir)
    ? fs.readdirSync(postsDir).filter(n => /\.(md|markdown)$/.test(n)).length
    : 0;

  if (htmlFiles.length === 0) {
    errors.push(
      'public/ contains no HTML pages at all.\n' +
      '    Deploying this would remove every page from the live site.\n' +
      '    Build with `npm run build`, not `npx hexo generate`.'
    );
  } else if (postCount && htmlFiles.length < postCount) {
    errors.push(
      `only ${htmlFiles.length} HTML pages for ${postCount} posts -- pages are missing.`
    );
  }

  // 4. Pages that should always be there.
  for (const rel of ['index.html', 'portfolio/index.html', 'about/index.html']) {
    const full = path.join(publicDir, rel);
    if (!fs.existsSync(full)) errors.push(`missing expected page: ${rel}`);
    else if (fs.statSync(full).size < 500) errors.push(`suspiciously small page: ${rel}`);
  }

  // 5. Local images that do not resolve. Not fatal -- a cover may still be
  //    on its way -- but it should be impossible to miss.
  const missing = new Set();
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const matches = html.matchAll(/<img[^>]+src="([^"]+)"/g);
    for (const m of matches) {
      const src = m[1];
      if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) continue;
      const resolved = src.startsWith('/')
        ? path.join(publicDir, decodeURIComponent(src))
        : path.resolve(path.dirname(file), decodeURIComponent(src));
      if (!fs.existsSync(resolved)) {
        missing.add(`${path.relative(publicDir, file)} -> ${src}`);
      }
    }
  }
  if (missing.size) {
    warnings.push(
      `${missing.size} image reference(s) do not resolve:\n` +
      [...missing].slice(0, 10).map(s => '      ' + s).join('\n')
    );
  }
}

for (const w of warnings) console.warn(`\n  WARNING  ${w}`);

if (errors.length) {
  console.error('\n  Build verification FAILED -- not deploying:\n');
  for (const e of errors) console.error(`    - ${e}`);
  console.error('');
  process.exit(1);
}

const summary = warnings.length ? ' (with warnings)' : '';
console.log(`\n  Build looks good${summary} -- proceeding to deploy.\n`);
