// Three.js r128 (version exacte du prototype) n'embarque pas ses types. Le moteur, copié tel quel,
// l'utilise en JavaScript ; la couche d'adaptation n'a besoin que de ces quelques éléments.
declare module 'three' {
  export const REVISION: string;
  export class WebGLRenderer {
    domElement: HTMLCanvasElement;
  }
}
