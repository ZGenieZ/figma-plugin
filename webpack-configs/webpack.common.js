const path = require('path');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const paths = require('./paths.js');

module.exports = {
  entry: {
    ui: paths.uiIndex,
    plugin: paths.pluginIndex,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|jpg|gif|webp|svg)$/,
        loader: 'url-loader',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@/public': path.resolve(__dirname, '../public/'),
      '@/shared': path.resolve(__dirname, '../src/shared/'),
      '@/plugin': path.resolve(__dirname, '../src/plugin/'),
      '@/ui': path.resolve(__dirname, '../src/ui/'),
    },
  },
  output: {
    filename: '[name].js',
    path: paths.appBuild,
    publicPath: '/',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CaseSensitivePathsPlugin(),
    new ForkTsCheckerWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: paths.uiHtml,
      filename: 'ui.html',
      inlineSource: '.(js)$',
      chunks: ['ui'],
      cache: true,
    }),
    new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
  ],
};
