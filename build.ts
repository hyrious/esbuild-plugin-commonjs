import { build } from 'esbuild'
import { rollup } from 'rollup'
import pkg from './package.json'

let bundle = await rollup({
  input: 'index.js',
  plugins: [
    {
      name: 'esbuild',
      resolveId(id) {
        if (id === 'index.js') return id
        if (id === 'fs' || id in pkg.peerDependencies) return { id, external: true }
      },
      async load(id) {
        if (id === 'index.js') {
          let result = await build({
            entryPoints: ['index.ts'],
            bundle: true,
            packages: 'external',
            sourcemap: true,
            sourcesContent: false,
            outfile: 'index.js',
            platform: 'node',
            format: 'esm',
            target: 'node14',
            write: false,
          }).catch(() => process.exit(1))

          let js = result.outputFiles.find(e => e.path.endsWith('.js'))!
          let map = result.outputFiles.find(e => e.path.endsWith('.map'))!

          return { code: js.text, map: map.text }
        }
      },
    },
  ],
})

await bundle.write({
  format: 'cjs',
  file: 'index.js',
  sourcemap: true,
  sourcemapExcludeSources: true,
})
