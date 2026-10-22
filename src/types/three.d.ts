// Three.js r128 (version exacte du prototype) n'embarque pas ses types. Le moteur, copié tel quel,
// l'utilise en JavaScript ; la couche d'adaptation et l'export n'ont besoin que de ces quelques éléments.
declare module 'three' {
  export const REVISION: string;
  export const LinearFilter: number;
  export const NoBlending: number;
  export const NormalBlending: number;
  export const MathUtils: { degToRad: (degrees: number) => number };

  export class Matrix4 {}
  export class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): this;
    applyMatrix4(matrix: Matrix4): this;
    distanceTo(vector: Vector3): number;
  }
  export class Texture {}
  export class WebGLRenderTarget {
    texture: Texture;
    constructor(width: number, height: number, options?: Record<string, unknown>);
    dispose(): void;
  }
  export class Scene {}
  export class Camera {
    position: Vector3;
    matrixWorldInverse: Matrix4;
    projectionMatrix: Matrix4;
    updateMatrixWorld(): void;
  }
  export class PerspectiveCamera extends Camera {
    aspect: number;
    fov: number;
    setViewOffset(
      fullWidth: number,
      fullHeight: number,
      x: number,
      y: number,
      width: number,
      height: number,
    ): void;
    clearViewOffset(): void;
    updateProjectionMatrix(): void;
  }
  export class ShaderMaterial {
    uniforms: Record<string, { value: unknown }>;
    blending: number;
  }
  export class WebGLRenderer {
    domElement: HTMLCanvasElement;
    capabilities: { maxTextureSize: number };
    setRenderTarget(target: WebGLRenderTarget | null): void;
    setClearColor(color: number, alpha: number): void;
    clear(): void;
    render(scene: Scene, camera: Camera): void;
    readRenderTargetPixels(
      target: WebGLRenderTarget,
      x: number,
      y: number,
      width: number,
      height: number,
      buffer: Uint8Array,
    ): void;
  }
}
