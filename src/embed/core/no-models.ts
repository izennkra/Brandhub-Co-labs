// Remplace lib/pattern-engine/models.ts dans les scripts d'intégration (vite.embed.config.ts) : les
// modèles 3D de l'Illustration (.glb, 3 Mo) ne sont pas livrés, et les scripts ne les créent jamais
// (noModels, core/engine.ts).
export function createModelViews(): never {
  throw new Error('Modèles 3D absents du script d’intégration');
}
