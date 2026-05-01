// Proxy entry for Vercel Serverless function — forwards requests to built Nest serverless handler
const path = require('path');
const Module = require('module');

// Fallback: if '@bromotors/db' can't be resolved by Node (happens when Vercel packages workspace differently),
// redirect resolution to the local packages/db/index.js file included in the repo.
try {
  const _resolve = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (request === '@bromotors/db') {
      try {
        // try normal resolution first
        return _resolve.call(this, request, parent, isMain, options);
      } catch (err) {
        // fallback to repo-local packages/db/index.js
        const local = path.join(__dirname, 'packages', 'db', 'index.js');
        return local;
      }
    }
    return _resolve.call(this, request, parent, isMain, options);
  };
} catch (err) {
  // if we can't monkeypatch resolver, continue without fallback
  console.warn('Could not setup module resolver fallback for @bromotors/db', err);
}

async function getHandler() {
  // prefer compiled dist handler if available
  const built = path.join(__dirname, 'apps', 'api', 'dist', 'serverless');
  try {
    // require may throw if file missing
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(built);
    return mod.default || mod;
  } catch (err) {
    // fallback to source handler if present
    try {
      const src = path.join(__dirname, 'apps', 'api', 'src', 'serverless');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod2 = require(src);
      return mod2.default || mod2;
    } catch (err2) {
      console.error('Failed to load API handler:', err, err2);
      throw err;
    }
  }
}

module.exports = async function (req, res) {
  try {
    console.log(`[api/index] ${req.method} ${req.url}`);
  } catch (err) {
    /* ignore logging errors */
  }
  try {
    const handler = await getHandler();
    return handler(req, res);
  } catch (err) {
    console.error('API handler error:', err && err.stack ? err.stack : err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
};
