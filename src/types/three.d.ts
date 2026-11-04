// Three.js r128 (version exacte du prototype) n'embarque pas ses types. Le moteur, copié tel quel,
// l'utilise en JavaScript ; la couche d'adaptation et l'export n'ont besoin que de ces quelques éléments.
declare module 'three' {
  export const REVISION: string;
  export const LinearFilter: number;
  export const NoBlending: number;
  export const NormalBlending: number;
  export const MathUtils: { degToRad: (degrees: number) => number };

  export const sRGBEncoding: number;
  export const DoubleSide: number;
  export class Material {}
  export class MeshPhongMaterial extends Material {
    constructor(parameters?: Record<string, unknown>);
  }
  export class Matrix4 {}
  export class Euler {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): this;
  }
  export class Quaternion {
    w: number;
    setFromEuler(euler: Euler): this;
    invert(): this;
    multiply(quaternion: Quaternion): this;
    copy(quaternion: Quaternion): this;
    slerp(target: Quaternion, t: number): this;
  }
  export class Object3D {
    position: Vector3;
    rotation: Euler;
    scale: Vector3 & { setScalar(value: number): Vector3 };
    children: Object3D[];
    add(...objects: Object3D[]): this;
    remove(...objects: Object3D[]): this;
    traverse(callback: (object: Object3D & { isMesh?: boolean; material?: Material }) => void): void;
  }
  export class Group extends Object3D {}
  export class Sphere {
    radius: number;
    center: Vector3;
  }
  export class Box3 {
    setFromObject(object: Object3D): this;
    getCenter(target: Vector3): Vector3;
    getBoundingSphere(target: Sphere): Sphere;
  }
  export class HemisphereLight extends Object3D {
    constructor(sky?: number, ground?: number, intensity?: number);
  }
  export class DirectionalLight extends Object3D {
    constructor(color?: number, intensity?: number);
  }
  export class AmbientLight extends Object3D {
    constructor(color?: number, intensity?: number);
  }
  export class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): this;
    sub(vector: Vector3): this;
    applyMatrix4(matrix: Matrix4): this;
    applyQuaternion(quaternion: Quaternion): this;
    add(vector: Vector3): this;
    distanceTo(vector: Vector3): number;
  }
  export class Texture {}
  export class WebGLRenderTarget {
    texture: Texture;
    constructor(width: number, height: number, options?: Record<string, unknown>);
    dispose(): void;
  }
  export class Scene extends Object3D {}
  export class Camera {
    position: Vector3;
    quaternion: Quaternion;
    lookAt(x: number, y: number, z: number): void;
    lookAt(target: Vector3): void;
    matrixWorldInverse: Matrix4;
    projectionMatrix: Matrix4;
    updateMatrixWorld(): void;
  }
  export class PerspectiveCamera extends Camera {
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
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
    constructor(options?: Record<string, unknown>);
    domElement: HTMLCanvasElement;
    outputEncoding: number;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    setPixelRatio(ratio: number): void;
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

// Chargeur de modèles .glb (exemples officiels de three r128), pour les illustrations en 3D.
declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  import type { Group } from 'three';
  export class GLTFLoader {
    loadAsync(url: string): Promise<{ scene: Group }>;
  }
}
