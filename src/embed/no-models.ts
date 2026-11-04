// Remplace models.ts dans le script d'intégration (vite.embed.config.ts) : les modèles 3D de
// l'Illustration (.glb, 3 Mo) ne servent pas au motif, et le lecteur ne les crée jamais (noModels).
export function createModelViews(): never {
  throw new Error('Modèles 3D absents du script d’intégration');
}
