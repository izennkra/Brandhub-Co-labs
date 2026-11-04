import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Script d'intégration sur un site (npm run build:embed) : un seul fichier, dist-embed/colabs-motif.js,
// avec le moteur, three.js et la police Geist dedans. Les modèles 3D de l'Illustration (.glb) restent
// dehors : le motif ne s'en sert pas (models.ts est remplacé par src/embed/no-models.ts).
export default defineConfig({
  publicDir: false,
  // en mode « fichier unique », Vite ne remplace pas process.env : le navigateur ne le connaît pas
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  resolve: {
    alias: [
      {
        find: /^\.\/models$/,
        replacement: fileURLToPath(new URL('./src/embed/no-models.ts', import.meta.url)),
      },
    ],
  },
  build: {
    outDir: 'dist-embed',
    emptyOutDir: true,
    lib: {
      entry: 'src/embed/colabs-motif.ts',
      formats: ['iife'],
      name: 'ColabsMotif',
      fileName: () => 'colabs-motif.js',
    },
  },
});
