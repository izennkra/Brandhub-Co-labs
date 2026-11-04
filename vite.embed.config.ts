import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Scripts d'intégration sur un site, un seul fichier chacun, avec le moteur, three.js et la police
// Geist dedans :
// - npm run build:embed               → dist-embed/colabs-motif.js (+ contenu de embed/)
// - npm run build:embed:illustration  → dist-embed-illustration/colabs-illustration.js
//                                       (+ contenu de embed-illustration/)
// Remplacés dans ces scripts seulement :
// - models.ts → src/embed/no-models.ts : les modèles 3D de l'Illustration (.glb, 3 Mo) ne sont pas livrés ;
// - store.ts → src/embed/memoryStore.ts : stockage en mémoire, rien d'écrit chez le visiteur.
const SCRIPTS = {
  motif: {
    entry: 'src/embed/colabs-motif.ts',
    outDir: 'dist-embed',
    file: 'colabs-motif.js',
    name: 'ColabsMotif',
    banner: [
      '/*! Motif Co-labs · <colabs-motif> — script d’intégration sur un site.',
      ' *  Usage : <script src="colabs-motif.js" defer></script> puis <colabs-motif forme="A"></colabs-motif>',
    ],
  },
  illustration: {
    entry: 'src/embed/colabs-illustration.ts',
    outDir: 'dist-embed-illustration',
    file: 'colabs-illustration.js',
    name: 'ColabsIllustration',
    banner: [
      '/*! Illustrations Co-labs · <colabs-illustration> — script d’intégration sur un site.',
      ' *  Usage : <script src="colabs-illustration.js" defer></script> puis <colabs-illustration></colabs-illustration>',
    ],
  },
};

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({ mode }) => {
  const script = mode === 'illustration' ? SCRIPTS.illustration : SCRIPTS.motif;
  // En tête du fichier livré : à quoi il sert et où lire le mode d'emploi (ajouté après la
  // minification, qui retire les commentaires).
  const banner = [
    ...script.banner,
    ' *  Attributs, exemples et limites : LISEZMOI.md (livré avec ce fichier).',
    ' *  Contient three.js (licence MIT) et la police Geist (licence OFL). */',
    '',
  ].join('\n');
  return {
    publicDir: false,
    plugins: [
      {
        name: 'colabs-banner',
        generateBundle(_options, bundle) {
          for (const file of Object.values(bundle)) if (file.type === 'chunk') file.code = banner + file.code;
        },
      },
    ],
    // en mode « fichier unique », Vite ne remplace pas process.env : le navigateur ne le connaît pas
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    resolve: {
      alias: [
        { find: /^\.\/models$/, replacement: local('./src/embed/no-models.ts') },
        { find: /^.*\/store\/store$/, replacement: local('./src/embed/memoryStore.ts') },
      ],
    },
    build: {
      outDir: script.outDir,
      emptyOutDir: true,
      lib: { entry: script.entry, formats: ['iife'], name: script.name, fileName: () => script.file },
    },
  };
});
