// Zoom au pincement du trackpad sur la scène du moteur, sans toucher au moteur.
// Le moteur zoome à la molette : rayon × exp(deltaY × 0,0012), réglé pour une souris (≈ 100 par cran).
// Un pincement envoie des « molettes » avec ctrlKey et de tout petits deltaY : le zoom se traînait.
// Ici, la scène intercepte ces événements et les renvoie au moteur, amplifiés (même vitesse que le
// Layout editor : 0,0105 au lieu de 0,0012). Safari, lui, envoie des événements « gesture » : ils sont
// convertis de la même façon, et la page entière ne zoome plus.
export const ENGINE_WHEEL_SPEED = 0.0012; // vitesse du moteur (prototype-engine.js, écouteur « wheel »)
export const PINCH_BOOST = 0.0105 / ENGINE_WHEEL_SPEED;

type GestureEvent = Event & { scale: number; clientX?: number; clientY?: number };

export function forwardPinchZoom(host: HTMLElement) {
  const forwarded = new WeakSet<Event>();
  let gestureScale = 0; // échelle du dernier « gesturechange » (0 : pas de pincement Safari en cours)

  const send = (target: EventTarget, deltaY: number, from: { clientX?: number; clientY?: number }) => {
    const event = new WheelEvent('wheel', {
      deltaY,
      ctrlKey: true,
      clientX: from.clientX ?? 0,
      clientY: from.clientY ?? 0,
      bubbles: true,
      cancelable: true,
    });
    forwarded.add(event);
    target.dispatchEvent(event);
  };
  const sceneOf = (event: Event) => {
    const target = event.target as Element | null;
    return target?.closest?.('canvas#scene') ?? null; // la scène du moteur (createEngine.ts)
  };

  const onWheel = (event: WheelEvent) => {
    if (!event.ctrlKey || forwarded.has(event)) return;
    const canvas = sceneOf(event);
    if (!canvas) return;
    event.preventDefault();
    event.stopPropagation();
    // pendant un pincement Safari, les événements « gesture » font déjà le zoom
    if (gestureScale) return;
    const pixels = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    send(canvas, pixels * PINCH_BOOST, event);
  };

  const onGestureStart = (event: Event) => {
    if (!sceneOf(event)) return;
    event.preventDefault();
    gestureScale = (event as GestureEvent).scale || 1;
  };
  const onGestureChange = (event: Event) => {
    const canvas = sceneOf(event);
    if (!canvas || !gestureScale) return;
    event.preventDefault();
    const scale = (event as GestureEvent).scale || gestureScale;
    // écarter les doigts (échelle × 2) rapproche la caméra de moitié, comme le pincement tactile du moteur
    send(canvas, Math.log(gestureScale / scale) / ENGINE_WHEEL_SPEED, event as GestureEvent);
    gestureScale = scale;
  };
  const onGestureEnd = (event: Event) => {
    if (gestureScale) event.preventDefault();
    gestureScale = 0;
  };

  host.addEventListener('wheel', onWheel, { capture: true, passive: false });
  host.addEventListener('gesturestart', onGestureStart, { passive: false });
  host.addEventListener('gesturechange', onGestureChange, { passive: false });
  host.addEventListener('gestureend', onGestureEnd, { passive: false });
  return () => {
    host.removeEventListener('wheel', onWheel, { capture: true });
    host.removeEventListener('gesturestart', onGestureStart);
    host.removeEventListener('gesturechange', onGestureChange);
    host.removeEventListener('gestureend', onGestureEnd);
  };
}
