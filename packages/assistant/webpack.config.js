const path = require('path');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');

module.exports = {
  plugins: [
    new Dotenv({
      path: './.env.development', // Path to your .env file
    }),
    new webpack.HotModuleReplacementPlugin(), // Add HMR support
  ],
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'), // Serve static files
    },
    watchFiles: ['src/**/*'], // Watch source files for changes
    hot: true, // Enable HMR
    liveReload: true, // Enable live reload
    open: false, // Disable auto-opening the browser
    port: 8080, // Specify port
    compress: true, // Enable gzip compression
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
        test: /\.(wav|mp3)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[hash].[ext]',
              outputPath: 'assets/audio/',
            },
          },
        ],
      },
    ],
  },
  mode: 'development', // Set mode to development
};
