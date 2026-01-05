import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', '@rockfridrich/villa-sdk'],
  treeshake: true,
  minify: false,
  target: 'es2020',
})
