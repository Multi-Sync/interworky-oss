const path = require('path');
const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.ACCESS_TOKEN': JSON.stringify(process.env.ACCESS_TOKEN),
      'process.env.NODE_PUBLIC_API_URL': JSON.stringify(
        process.env.NODE_PUBLIC_API_URL
      ),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.INTERWORKY_LOG_LEVEL': JSON.stringify(
        process.env.INTERWORKY_LOG_LEVEL
      ),
      'process.env.INTERWORKY_LOG_FORMAT': JSON.stringify(
        process.env.INTERWORKY_LOG_FORMAT
      ),
      'process.env.AUTH_GOOGLE_ID': JSON.stringify(process.env.AUTH_GOOGLE_ID),
      'process.env.DASHBOARD_URL': JSON.stringify(process.env.DASHBOARD_URL),
      'process.env.AI_BASE_URL': JSON.stringify(process.env.AI_BASE_URL || 'https://api.openai.com/v1'),
      'process.env.AI_MODEL': JSON.stringify(process.env.AI_MODEL || 'gpt-4o'),
      'process.env.AI_REALTIME_MODEL': JSON.stringify(process.env.AI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17'),
    }),
  ],
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
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
      },
    ],
  },
  mode: 'production', // Set mode to production
};
