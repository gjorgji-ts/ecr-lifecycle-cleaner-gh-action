// See: https://rollupjs.org/introduction/

import { RollupOptions, Plugin } from 'rollup'

import typescript from '@rollup/plugin-typescript'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

const config: RollupOptions = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    (typescript as unknown as () => Plugin)(),
    (
      nodeResolve as unknown as (options: { preferBuiltins: boolean }) => Plugin
    )({
      preferBuiltins: true
    }),
    (commonjs as unknown as () => Plugin)()
  ]
}

export default config
