const nodeExternals = require('webpack-node-externals');

module.exports = (options) => ({
  ...options,
  externals: [
    nodeExternals({
      // Bundle workspace libs instead of leaving them as externals
      allowlist: [/@resume-platform\/.*/],
    }),
    // Puppeteer must stay external — it relies on native Chromium binaries
    { puppeteer: 'commonjs puppeteer' },
  ],
});
