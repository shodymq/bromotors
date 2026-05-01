// Proxy entry for Vercel Serverless function — forwards requests to built Nest serverless handler
const path = require('path');

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
