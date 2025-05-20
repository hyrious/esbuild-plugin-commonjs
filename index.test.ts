import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import { commonjs } from './index'

await build({
  entryPoints: ['fixture/cjs-interop.ts'],
  bundle: true,
  plugins: [
    commonjs({
      only: 'external',
    }),
  ],
  minifySyntax: true,
  format: 'esm',
  external: ['react'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  outfile: 'node_modules/.test.mjs',
}).catch(() => process.exit(1))

spawnSync('node', ['node_modules/.test.mjs'], { stdio: 'inherit' })
