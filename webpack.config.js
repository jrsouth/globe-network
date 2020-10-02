const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'script.js'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public', to: './' },
      ],
    }),
  ],
};
