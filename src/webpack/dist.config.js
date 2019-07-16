const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const external = path.resolve(__dirname, './provide.js')
module.exports = function (config, root) {
  return {
    mode: 'production',
    devtool: false,
    entry: {
      plugin: config.entry,
      ...config.extendedEntries,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              plugins: [
                path.resolve(
                  root,
                  'node_modules',
                  'babel-plugin-transform-class-properties'
                ),
              ],
            },
          },
        },
        {
          test: /\.(png|jpg|gif)$/i,
          use: [
            {
              loader: 'url-loader',
              options: {
                quality: 85,
                limit: Number.MAX_SAFE_INTEGER,
              },
            },
          ],
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: [
                  require('postcss-prefix-selector')({prefix: `[arena-scope="${config.id}"]`}),
                ],
              },
            },
            'sass-loader',
          ],
        },
      ],
    },
    output: {
      filename: `[name]-${config.id}.compiled`,
      path: config.dist,
      library: config.id,
      libraryTarget: 'window',
    },
    resolveLoader: {
      modules: [path.resolve(root, 'node_modules')],
    },
    plugins: [
      new webpack.ProvidePlugin({
        document: [external, 'document'],
        Vue: [external, 'Vue'],
      }),
      new MiniCssExtractPlugin({
        filename: '[name]_style.css',
      }),
    ],
  }
}
