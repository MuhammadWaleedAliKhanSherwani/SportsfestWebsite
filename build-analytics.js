// Build script for Vercel Analytics
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['analytics.js'],
  bundle: true,
  outfile: 'analytics.bundle.js',
  format: 'iife',
  platform: 'browser',
  target: ['es2015'],
}).catch(() => process.exit(1));

