const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const external = path.resolve(__dirname, './provide.js')
const TerserPlugin = require('terser-webpack-plugin')
module.exports = function (config, root, prod) {
  const cfg = {
    mode: 'production',
    devtool: false,
    entry: {
      plugin: config.entry,
      ...config.extendedEntries,
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              plugins: [
                [path.resolve(root, 'node_modules', "@babel/plugin-transform-react-jsx"), {
                  "pragma": "ArenaPluginTrans", // default pragma is React.createElement
                  "pragmaFrag": "ArenaPluginTrans.f", // default is React.Fragment
                  "throwIfNamespace": false // defaults to true
                }],
                path.resolve(
                  root,
                  'node_modules',
                  'babel-plugin-transform-class-properties',
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
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
    },
    plugins: [
      // new webpack.NormalModuleReplacementPlugin(/arena-types/, './types.js'),
      // new webpack.IgnorePlugin('arena-types'),
      new webpack.ProvidePlugin({
        document: [external, 'document'],
        Vue: [external, 'Vue'],
        // 'arena-types': [external, 'types'],
      }),
      new MiniCssExtractPlugin({
        filename: '[name]_style.css',
      }),
    ],
  }

  if (prod) {
    cfg.optimization = {
      minimizer: [new TerserPlugin()],
    }
  }

  return cfg
}
