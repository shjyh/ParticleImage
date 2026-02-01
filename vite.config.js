
import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  build: {
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
