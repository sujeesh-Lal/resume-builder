const nodeExternals = require('webpack-node-externals');

module.exports = (options) => ({
  ...options,
  externals: [
    nodeExternals({
      // Bundle workspace libs instead of leaving them as externals
      allowlist: [/@resume-platform\/.*/],
    }),
  ],
});
