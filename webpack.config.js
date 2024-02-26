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
    filename: 'yoda-player.bundle.js',
    path: path.resolve(__dirname, 'demo/js'),
    library: 'yoda',
    libraryTarget: 'umd',
    libraryExport: 'default',
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'demo'),
    },
    host: '0.0.0.0',
    port: 9000,
    compress: true,
    hot: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    devMiddleware: {
      writeToDisk: (filepath) => /\.bundle\.js$/.test(filepath)
    }
  },
};
