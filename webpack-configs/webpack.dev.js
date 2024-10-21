'use strict';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const common = require('./webpack.common');

const updatedPlugins = common.plugins.map((plugin) => {
  if (plugin instanceof HtmlWebpackPlugin) {
    return new HtmlWebpackPlugin({
      ...plugin.userOptions,
      cache: false,
    });
  }
  return plugin;
});

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: updatedPlugins,
};
