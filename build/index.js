import buildManifestZips from './package.js';

// Run the package function
await buildManifestZips().catch(console.error);
