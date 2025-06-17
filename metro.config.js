const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

// Configuration pour améliorer les source maps en développement
if (process.env.NODE_ENV === 'development') {
  config.serializer = {
    ...config.serializer,
    map: true, // Activer les source maps
  };
}

module.exports = config;