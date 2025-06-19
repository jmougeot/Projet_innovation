const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Essential configurations only
config.resolver.sourceExts.push('cjs');

// Disable symbolication entirely to fix the "unknown" file error
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url === '/symbolicate') {
        // Skip symbolication requests that cause the error
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end('{"stack":[]}');
        return;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;