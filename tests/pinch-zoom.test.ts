import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ENGINE_WHEEL_SPEED, forwardPinchZoom, PINCH_BOOST } from '../src/components/engine/pinchZoom';

// La scène du moteur reçoit la « molette » : on vérifie ce qui arrive au canvas, comme le moteur le verrait.
let host: HTMLDivElement;
let canvas: HTMLCanvasElement;
let received: WheelEvent[];
let stop: () => void;

beforeEach(() => {
  host = document.createElement('div');
  canvas = document.createElement('canvas');
  canvas.id = 'scene';
  host.append(canvas);
  document.body.append(host);
  received = [];
  canvas.addEventListener('wheel', (event) => received.push(event));
  stop = forwardPinchZoom(host);
});

afterEach(() => {
  stop();
  host.remove();
});

const wheel = (init: WheelEventInit) => {
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
  canvas.dispatchEvent(event);
  return event;
};

const gesture = (type: string, scale: number) => {
  const event = Object.assign(new Event(type, { bubbles: true, cancelable: true }), { scale });
  canvas.dispatchEvent(event);
  return event;
};

describe('zoom au pincement du trackpad (scène du moteur)', () => {
  it('amplifie le pincement (molette avec ctrlKey) pour qu’il ne se traîne plus', () => {
    const original = wheel({ deltaY: 4, ctrlKey: true });
    expect(original.defaultPrevented).toBe(true); // la page ne zoome pas
    expect(received).toHaveLength(1);
    expect(received[0].deltaY).toBeCloseTo(4 * PINCH_BOOST);
    expect(PINCH_BOOST).toBeCloseTo(8.75); // même vitesse que le Layout editor
  });

  it('laisse la molette normale (sans ctrlKey) intacte', () => {
    wheel({ deltaY: 100 });
    expect(received).toHaveLength(1);
    expect(received[0].deltaY).toBe(100);
  });

  it('Safari : convertit le pincement « gesture » et empêche la page de zoomer', () => {
    expect(gesture('gesturestart', 1).defaultPrevented).toBe(true);
    expect(gesture('gesturechange', 2).defaultPrevented).toBe(true);
    // doigts écartés (× 2) : le moteur rapproche la caméra de moitié
    expect(received).toHaveLength(1);
    expect(Math.exp(received[0].deltaY * ENGINE_WHEEL_SPEED)).toBeCloseTo(0.5);
    // pendant le geste, une éventuelle molette ctrlKey n'ajoute pas un second zoom
    wheel({ deltaY: 4, ctrlKey: true });
    expect(received).toHaveLength(1);
    gesture('gestureend', 2);
    wheel({ deltaY: 4, ctrlKey: true });
    expect(received).toHaveLength(2);
  });

  it('ne touche à rien hors du canvas de la scène, ni après démontage', () => {
    const button = document.createElement('button');
    host.append(button);
    const outside = new WheelEvent('wheel', { deltaY: 4, ctrlKey: true, bubbles: true, cancelable: true });
    button.dispatchEvent(outside);
    expect(outside.defaultPrevented).toBe(false);
    stop();
    wheel({ deltaY: 4, ctrlKey: true });
    expect(received.at(-1)!.deltaY).toBe(4);
  });
});
