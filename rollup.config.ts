// See: https://rollupjs.org/introduction/

import type { RollupOptions, Plugin } from 'rollup'

// Import plugins with proper typing
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
    // Cast to Plugin to avoid TypeScript issues with plugin function signatures
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
