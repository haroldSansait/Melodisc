const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Extend asset resolver to bundle 3D model formats alongside standard media
config.resolver.assetExts.push('glb', 'gltf', 'png', 'jpg', 'jpeg', 'svg');

module.exports = config;
