import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  root: './',
  plugins: [
    {
      name: 'copy-dts',
      closeBundle() {
        const src = path.resolve(__dirname, 'src/ParticleImage.d.ts');
        const dest = path.resolve(__dirname, 'dist/particle-image.d.ts');
        if (fs.existsSync(src)) {
          if (!fs.existsSync(path.dirname(dest))) {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
          }
          fs.copyFileSync(src, dest);
        }
      }
    }
  ],
  build: {
    minify: 'terser',
    lib: {
      entry: 'src/ParticleImage.js',
      name: 'ParticleImage',
      formats: ['es'],
      fileName: 'particle-image.es'
    },
    rollupOptions: {
      external: ['three', 'gsap', 'poisson-disk-sampling'],
      output: {
        globals: {
          three: 'THREE',
          gsap: 'gsap',
          'poisson-disk-sampling': 'PoissonDiskSampling'
        }
      }
    }
  }
});
