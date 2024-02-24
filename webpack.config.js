const path = require('path');

module.exports = {
  entry: './src/index.ts',
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        include: [path.resolve(__dirname, 'src')],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'yoda-player.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'yoda',
    libraryTarget: 'umd',
    libraryExport: 'default',
  },
};
