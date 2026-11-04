import { cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

// Scripts d'intégration sur un site (src/embed/) : un seul fichier JavaScript chacun, avec le moteur,
// three.js et la police Geist dedans, livré avec son dossier (embed/<nom>/ : configurateur, exemples,
// mode d'emploi, illustrations). dist-embed/ est le dossier à transmettre, tel quel :
//   dist-embed/LISEZMOI.md                     ← sommaire (embed/LISEZMOI.md)
//   dist-embed/colabs-motif/                   ← npm run build:embed:motif
//   dist-embed/colabs-illustration/            ← npm run build:embed:illustration
//   (npm run build:embed : les deux)
// Remplacés dans ces scripts seulement :
// - lib/pattern-engine/models.ts → core/no-models.ts : les modèles 3D (.glb, 3 Mo) ne sont pas livrés ;
// - lib/store/store.ts → core/memoryStore.ts : stockage en mémoire, rien d'écrit chez le visiteur.

type Script = { tag: string; file: string; global: string; usage: string };

const SCRIPTS: Record<string, Script> = {
  motif: {
    tag: 'colabs-motif',
    file: 'colabs-motif.js',
    global: 'ColabsMotif',
    usage: 'Motif Co-labs · <colabs-motif forme="A"></colabs-motif>',
  },
  illustration: {
    tag: 'colabs-illustration',
    file: 'colabs-illustration.js',
    global: 'ColabsIllustration',
    usage: 'Illustrations Co-labs · <colabs-illustration></colabs-illustration>',
  },
};

const DIST = 'dist-embed';
const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// En tête du fichier livré : à quoi il sert et où lire le mode d'emploi (ajouté après la minification,
// qui retire les commentaires).
function banner(script: Script): Plugin {
  const text = [
    `/*! ${script.usage} — script d’intégration sur un site.`,
    ` *  Usage : <script src="${script.file}" defer></script>, puis la balise <${script.tag}>.`,
    ' *  Attributs, exemples et limites : LISEZMOI.md (livré avec ce fichier).',
    ' *  Contient three.js (licence MIT) et la police Geist (licence OFL). */',
    '',
  ].join('\n');
  return {
    name: 'colabs-banner',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) if (file.type === 'chunk') file.code = text + file.code;
    },
  };
}

// Le dossier livré avec le script (embed/<nom>/), copié à côté de lui, et le sommaire général.
function deliverable(name: string, outDir: string): Plugin {
  return {
    name: 'colabs-deliverable',
    closeBundle() {
      cpSync(local(`./embed/${name}`), local(`./${outDir}`), { recursive: true });
      cpSync(local('./embed/LISEZMOI.md'), local(`./${DIST}/LISEZMOI.md`));
    },
  };
}

export default defineConfig(({ mode }) => {
  const script = SCRIPTS[mode];
  if (!script) throw new Error(`Script d’intégration inconnu : « ${mode} » (motif ou illustration).`);
  const outDir = `${DIST}/${script.tag}`;
  return {
    publicDir: false,
    plugins: [banner(script), deliverable(mode, outDir)],
    // en mode « fichier unique », Vite ne remplace pas process.env : le navigateur ne le connaît pas
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    resolve: {
      alias: [
        { find: /^\.\/models$/, replacement: local('./src/embed/core/no-models.ts') },
        { find: /^.*\/store\/store$/, replacement: local('./src/embed/core/memoryStore.ts') },
      ],
    },
    build: {
      outDir,
      emptyOutDir: true,
      lib: {
        entry: local(`./src/embed/${mode}/${script.tag}.ts`),
        formats: ['iife'],
        name: script.global,
        fileName: () => script.file,
      },
    },
  };
});
