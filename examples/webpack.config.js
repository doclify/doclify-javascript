const fs = require('fs')
const path = require('path')
const webpack = require('webpack')

require('dotenv').config()

module.exports = {
  // Expose __dirname to allow automatically setting basename.
  context: __dirname,
  node: {
    __dirname: true
  },

  mode: process.env.NODE_ENV || 'development',

  entry: fs.readdirSync(__dirname).reduce((entries, dir) => {
    const fullDir = path.join(__dirname, dir)
    const entry = path.join(fullDir, 'app.js')
    if (fs.statSync(fullDir).isDirectory() && fs.existsSync(entry)) {
      entries[dir] = ['es6-promise/auto', entry]
    }

    return entries
  }, {}),

  output: {
    path: path.join(__dirname, '__build__'),
    filename: '[name].js',
    chunkFilename: '[id].chunk.js',
    publicPath: '/__build__/'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: ['css-loader']
      }
    ]
  },

  plugins: [
    new webpack.EnvironmentPlugin(['REPOSITORY', 'API_KEY'])
  ],

  resolve: {
    alias: {
      '@doclify/javascript': path.join(__dirname, '..', 'src')
    }
  },

  optimization: {
    splitChunks: {
      cacheGroups: {
        shared: {
          name: 'shared',
          chunks: 'initial',
          minChunks: 2
        }
      }
    }
  }
}