import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  treeshake: true,
  outDir: './dist',
  format: ['esm', 'cjs'],
  dts: true,
  platform: 'neutral',
  target: 'es2022',
})
