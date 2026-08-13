'use strict';

/**
 * Node compatibility shim for this (Hexo 3.9-era) site.
 *
 * Loaded via `node -r ./tools/node-compat.js` from the npm scripts in
 * package.json, so it is in place before Hexo requires anything.
 *
 * Two independent breakages happen when running this old stack on a modern
 * Node (verified on Node 26). Both are patched here rather than by editing
 * node_modules, so a fresh `npm install` cannot silently undo them.
 *
 * Remove this file (and the `-r` flag in package.json) if the site is ever
 * upgraded to Hexo 5+, which fixes both issues upstream.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const Module = require('module');

const siteDir = path.join(__dirname, '..');

function warn(msg) {
  console.warn(`[node-compat] ${msg}`);
}

/* ------------------------------------------------------------------ *
 * 1. util.isDate  --  removed in Node 23
 *
 * Still called by hexo-front-matter@0.2.3 (lib/front_matter.js, timezone
 * conversion) and warehouse@2.x (lib/util.js, lib/types/date.js -- Hexo's
 * database layer). Without it every post and page fails to process with
 * "TypeError: isDate is not a function" and only static assets are emitted.
 * ------------------------------------------------------------------ */

if (typeof util.isDate !== 'function') {
  util.isDate = util.types.isDate;
}

/* ------------------------------------------------------------------ *
 * 2. CacheStream clears itself too early  --  broken since Node 14
 *
 * hexo/lib/plugins/console/generate.js defines a private CacheStream that
 * buffers every chunk into `this._cache` and overrides `destroy()` to empty
 * it. The generate console then does:
 *
 *     pipeStream(dataStream, cacheStream, hashStream)
 *       .then(() => fs.writeFile(dest, cacheStream.getCache()))
 *       .finally(() => cacheStream.destroy());
 *
 * Node 14 made `autoDestroy` the default for streams, so the stream
 * machinery now calls destroy() itself the moment the pipe finishes -- i.e.
 * BEFORE getCache() runs. getCache() then returns an empty Buffer and every
 * rendered page is written to disk as a 0-byte file, with no error logged.
 *
 * CacheStream is module-private, so it cannot be monkey-patched from the
 * outside. Instead we rewrite that one constructor call as the file is
 * compiled, opting the stream out of autoDestroy and restoring the ordering
 * the surrounding code was written against: only Hexo's own explicit
 * destroy() in the .finally() clears the cache.
 * ------------------------------------------------------------------ */

const TARGET = path.join('hexo', 'lib', 'plugins', 'console', 'generate.js');
const FIND = 'Reflect.apply(Transform, this, []);';
const REPLACE = 'Reflect.apply(Transform, this, [{ autoDestroy: false }]);';

let generateJsPath = null;
try {
  generateJsPath = require.resolve('hexo/lib/plugins/console/generate.js', {
    paths: [siteDir]
  });
} catch (err) {
  warn(`could not locate ${TARGET} -- skipping the CacheStream patch.`);
}

if (generateJsPath) {
  const loadJs = Module._extensions['.js'];

  Module._extensions['.js'] = function (module, filename) {
    if (filename !== generateJsPath) return loadJs(module, filename);

    // Restore the default loader; this file is only ever compiled once.
    Module._extensions['.js'] = loadJs;

    const source = fs.readFileSync(filename, 'utf8');

    if (!source.includes(FIND)) {
      // Already fixed upstream, or the internals moved. Either way, don't
      // silently ship 0-byte pages -- load it unmodified and say so.
      warn(
        `expected code not found in ${TARGET}; loading it unpatched. ` +
        'If generated HTML files come out empty, this shim needs updating.'
      );
      return loadJs(module, filename);
    }

    module._compile(source.replace(FIND, REPLACE), filename);
  };
}
