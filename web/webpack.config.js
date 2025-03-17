const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config) => {
  // Ignore source map warnings
  config.ignoreWarnings = [/Failed to parse source map/];
  
  // Configure fallbacks for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    vm: require.resolve('vm-browserify')
  };

  // Copy static directory to output
  config.plugins.push(
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/static', to: 'static' }
      ]
    })
  );

  return config;
});