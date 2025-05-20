import { readFileSync, writeFileSync } from 'fs'

let code = readFileSync('index.js', 'utf8')
code = code.replace(
  'exports.commonjs = commonjs;',
  `exports.commonjs = commonjs;\ncommonjs.commonjs = commonjs;\nmodule.exports = commonjs;`,
)
writeFileSync('index.js', code, 'utf8')

let types = readFileSync('index.d.ts', 'utf8')
types = types.replace('export { commonjs };', 'export { commonjs, commonjs as default };')
writeFileSync('index.d.ts', types, 'utf8')
