import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Script d'intégration sur un site (npm run build:embed) : un seul fichier, dist-embed/colabs-motif.js,
// avec le moteur, three.js et la police Geist dedans. Les modèles 3D de l'Illustration (.glb) restent
// dehors : le motif ne s'en sert pas (models.ts est remplacé par src/embed/no-models.ts).
// Le contenu de embed/ (configurateur, exemples, LISEZMOI) est copié à côté, dans dist-embed/.
// En tête du fichier livré : à quoi il sert et où lire le mode d'emploi (ajouté après la minification,
// qui retire les commentaires).
const BANNER = [
  '/*! Motif Co-labs · <colabs-motif> — script d’intégration sur un site.',
  ' *  Usage : <script src="colabs-motif.js" defer></script> puis <colabs-motif forme="A"></colabs-motif>',
  ' *  Attributs, exemples et limites : LISEZMOI.md (livré avec ce fichier).',
  ' *  Contient three.js (licence MIT) et la police Geist (licence OFL). */',
  '',
].join('\n');

export default defineConfig({
  publicDir: false,
  plugins: [
    {
      name: 'colabs-banner',
      generateBundle(_options, bundle) {
        for (const file of Object.values(bundle)) if (file.type === 'chunk') file.code = BANNER + file.code;
      },
    },
  ],
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
