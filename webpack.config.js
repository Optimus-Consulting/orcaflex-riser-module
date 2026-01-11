const path = require('path');
const webpack = require('webpack');
const ModuleFederationPlugin = webpack.container.ModuleFederationPlugin;
const { AngularWebpackPlugin } = require('@ngtools/webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.ts',
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      publicPath: 'auto',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@orcaflex': path.resolve(__dirname, 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          loader: '@ngtools/webpack',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['to-string-loader', 'css-loader'],
        },
        {
          test: /\.scss$/,
          use: ['to-string-loader', 'css-loader', 'sass-loader'],
        },
      ],
    },
    plugins: [
      new AngularWebpackPlugin({
        tsconfig: './tsconfig.json',
        jitMode: false, // Use AOT compilation
        directTemplateLoading: true,
      }),
      new ModuleFederationPlugin({
        name: 'orcaflex_riser_module',
        filename: 'remoteEntry.js',
        exposes: {
          './Module': './src/module.ts',
        },
        shared: {
          '@angular/core': {
            singleton: true,
            strictVersion: false,
            requiredVersion: '^21.0.0',
          },
          '@angular/common': {
            singleton: true,
            strictVersion: false,
            requiredVersion: '^21.0.0',
          },
          '@angular/forms': {
            singleton: true,
            strictVersion: false,
            requiredVersion: '^21.0.0',
          },
          '@angular/material': {
            singleton: true,
            strictVersion: false,
            requiredVersion: '^21.0.0',
          },
          'rxjs': {
            singleton: true,
            strictVersion: false,
            requiredVersion: '^7.8.0',
          },
          'three': {
            singleton: true,
            strictVersion: false,
            requiredVersion: '^0.170.0',
          },
        },
      }),
    ],
    devServer: {
      port: 4202,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      hot: true,
    },
    optimization: {
      minimize: isProduction,
    },
  };
};
