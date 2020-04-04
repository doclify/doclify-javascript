const path = require('path')
const buble = require('rollup-plugin-buble')
const flow = require('rollup-plugin-flow-no-whitespace')
const cjs = require('rollup-plugin-commonjs')
const node = require('rollup-plugin-node-resolve')
const replace = require('rollup-plugin-replace')
const autoExternal = require('rollup-plugin-auto-external')
const version = process.env.VERSION || require('../package.json').version
const banner =
`/*!
  * @doclify/javascript v${version}
  * (c) ${new Date().getFullYear()} Doclify
  * @license MIT
  */`

const resolve = _path => path.resolve(__dirname, '../', _path)

module.exports = [
  // browser dev
  {
    file: resolve('dist/doclify-javascript.js'),
    format: 'umd',
    env: 'development'
  },
  {
    file: resolve('dist/doclify-javascript.min.js'),
    format: 'umd',
    env: 'production'
  },
  {
    file: resolve('dist/doclify-javascript.common.js'),
    format: 'cjs'
  },
  {
    file: resolve('dist/doclify-javascript.esm.js'),
    format: 'es'
  },
  {
    file: resolve('dist/doclify-javascript.esm.browser.js'),
    format: 'es',
    env: 'development',
    transpile: false
  },
  {
    file: resolve('dist/doclify-javascript.esm.browser.min.js'),
    format: 'es',
    env: 'production',
    transpile: false
  }
].map(genConfig)

function genConfig (opts) {
  const config = {
    input: {
      input: resolve('src/index.js'),
      plugins: [
        autoExternal({
          dependencies: false
        }),
        flow(),
        node(),
        cjs(),
        replace({
          __VERSION__: version
        })
      ]
    },
    output: {
      file: opts.file,
      format: opts.format,
      banner,
      name: 'DoclifyJS'
    }
  }

  if (opts.env) {
    config.input.plugins.unshift(replace({
      'process.env.NODE_ENV': JSON.stringify(opts.env)
    }))
  }

  if (opts.transpile !== false) {
    config.input.plugins.push(buble())
  }

  return config
}
