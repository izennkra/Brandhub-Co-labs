import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { formatName, layoutStore, useLayout, type Layer, type PatternLayer } from '../../lib/layout/doc';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import { useEngine } from '../EditorPanel/useEngine';
import { Toaster } from '../Toaster';
import { AddLayerButtons } from './AddLayerButtons';
import styles from './LayoutStage.module.css';

// Zone centrale du Layout editor (Figma « Tool / Layout editor Motif ») : un frame centré sur la
// toile à points, son nom au-dessus, son format en dessous. Les calques se déplacent à la souris,
// se redimensionnent par les coins (Maj : proportions gardées) et au clavier (flèches, Maj ×10).

const MARGIN = 72; // espace autour du frame, en pixels d'écran (place du nom et du format)
type Handle = 'nw' | 'ne' | 'sw' | 'se';
type Drag = {
  id: string;
  handle: Handle | null;
  x: number;
  y: number;
  box: Pick<Layer, 'x' | 'y' | 'w' | 'h'>;
};

// libreTick (ligne 3765) : chaque calque de motif visible est dessiné par le moteur, à la taille
// de l'export (1400 px au plus) pour que l'aperçu soit ce qu'on exporte.
function createTick(engine: Engine, zoom: { current: number }) {
  let n = 0;
  return (dt: number) => {
    const bridge = engine.layout;
    if (bridge.exporting) return;
    n++;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cap = Math.min(2048, bridge.maxTexture);
    const list = layoutStore.doc.layers.filter(
      (l): l is PatternLayer => l.type === 'pattern' && !l.hidden && Boolean(l._cv),
    );
    const animated = list.filter((l) => l.anim).length;
    const every = animated > 2 ? Math.ceil(animated / 2) : 1;
    list.forEach((L, i) => {
      L._acc = (L._acc ?? 0) + dt;
      const cv = L._cv!;
      let pw = Math.max(L.w * zoom.current * dpr, Math.min(L.w, 1400)),
        ph = (pw * L.h) / L.w;
      const k = Math.min(1, cap / Math.max(pw, ph));
      pw = Math.max(4, Math.round(pw * k));
      ph = Math.max(4, Math.round(ph * k));
      if (Math.abs(cv.width - pw) > pw * 0.12 || Math.abs(cv.height / cv.width - ph / pw) > 0.01) {
        cv.width = pw;
        cv.height = ph;
        L.dirty = true;
      }
      const turn = (L.anim || L === bridge.live) && (n + i) % every === 0;
      if (!turn && !L.dirty) return;
      const step = L.anim ? Math.min(0.1, L._acc) : 0;
      L._acc = 0;
      bridge.render(L, cv, step);
      L.dirty = false;
    });
  };
}

export function LayoutStage() {
  const engine = useEngine(true);
  const { doc, selected, layer } = useLayout();
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const zoom = useRef(1);
  const drag = useRef<Drag | null>(null);

  // Le moteur passe en mode layout tant que la page est ouverte.
  useEffect(() => {
    if (!engine) return;
    engine.layout.enter(createTick(engine, zoom));
    layoutStore.onBeforeSave(engine.layout.syncLive);
    const onSettings = () => {
      if (engine.layout.live) {
        engine.layout.live.dirty = true;
        layoutStore.touch();
      }
    };
    engine.events.addEventListener('settings', onSettings);
    return () => {
      engine.events.removeEventListener('settings', onSettings);
      engine.layout.syncLive();
      layoutStore.onBeforeSave(null);
      engine.layout.leave();
    };
  }, [engine]);

  // Le motif choisi se règle dans le panneau (Pastilles, Survol, Rotation, Couleurs).
  useEffect(() => {
    engine?.layout.setLive(layer?.type === 'pattern' ? layer : null);
  }, [engine, layer]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const z = size.w
    ? Math.max(0.01, Math.min((size.w - MARGIN * 2) / doc.w, (size.h - MARGIN * 2) / doc.h))
    : 0;
  useLayoutEffect(() => {
    zoom.current = z || 1;
  }, [z]);
  const fw = doc.w * z,
    fh = doc.h * z;
  const left = (size.w - fw) / 2,
    top = (size.h - fh) / 2;

  const start = (event: PointerEvent, id: string, handle: Handle | null) => {
    event.stopPropagation();
    if (event.button !== 0) return;
    const target = layoutStore.layer(id);
    if (!target) return;
    layoutStore.select(id);
    host.current?.setPointerCapture(event.pointerId);
    drag.current = { id, handle, x: event.clientX, y: event.clientY, box: { ...target } };
  };

  const move = (event: PointerEvent) => {
    const d = drag.current;
    if (!d || !z) return;
    const dx = (event.clientX - d.x) / z,
      dy = (event.clientY - d.y) / z;
    const { x, y, w, h } = d.box;
    if (!d.handle) return layoutStore.updateLayer(d.id, { x: x + dx, y: y + dy });
    const west = d.handle.includes('w'),
      north = d.handle.includes('n');
    let nw = Math.max(8, west ? w - dx : w + dx),
      nh = Math.max(8, north ? h - dy : h + dy);
    if (event.shiftKey) {
      const k = Math.max(nw / w, nh / h);
      nw = w * k;
      nh = h * k;
    }
    layoutStore.updateLayer(d.id, { x: west ? x + w - nw : x, y: north ? y + h - nh : y, w: nw, h: nh });
  };

  const end = (event: PointerEvent) => {
    drag.current = null;
    if (host.current?.hasPointerCapture(event.pointerId)) host.current.releasePointerCapture(event.pointerId);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!layer) return;
    const step = event.shiftKey ? 10 : 1;
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (arrows[event.key]) {
      event.preventDefault();
      const [dx, dy] = arrows[event.key];
      layoutStore.updateLayer(layer.id, { x: layer.x + dx, y: layer.y + dy });
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      layoutStore.removeLayer(layer.id);
    } else if (event.key === 'Escape') layoutStore.select(null);
  };

  const box = (l: Layer) => ({
    left: l.x * z,
    top: l.y * z,
    width: l.w * z,
    height: l.h * z,
    transform: `rotate(${l.r}deg)`,
  });
  const fill = doc.fill && engine ? engine.layout.hex[doc.fill] : undefined;

  return (
    <div
      ref={host}
      className={styles.stage}
      tabIndex={0}
      aria-label={`Frame ${doc.name}, ${doc.w} × ${doc.h} px. Flèches : déplacer le calque choisi ; Suppr : le retirer.`}
      onPointerDown={() => layoutStore.select(null)}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
    >
      {z > 0 && (
        <>
          <div className={styles.frameName} style={{ left, top: top - 28, width: fw }}>
            {doc.name}
          </div>
          <div
            className={styles.frame}
            data-transparent={!doc.fill}
            style={{
              left,
              top,
              width: fw,
              height: fh,
              background: fill,
              overflow: doc.clip ? 'hidden' : 'visible',
            }}
          >
            {doc.layers.map((l) =>
              l.hidden ? null : (
                <div
                  key={l.id}
                  className={styles.layer}
                  style={box(l)}
                  data-selected={l.id === selected}
                  onPointerDown={(event) => start(event, l.id, null)}
                >
                  {l.type === 'pattern' ? (
                    <canvas
                      aria-hidden="true"
                      ref={(element) => {
                        if (element && l._cv !== element) {
                          l._cv = element;
                          l.dirty = true;
                        }
                      }}
                    />
                  ) : (
                    <img src={l.src} alt="" draggable={false} />
                  )}
                </div>
              ),
            )}
            {!doc.layers.length && (
              <div className={styles.empty} onPointerDown={(event) => event.stopPropagation()}>
                <p>Place un motif dans ce format.</p>
                <AddLayerButtons engine={engine} />
              </div>
            )}
          </div>
          {layer && !layer.hidden && (
            <div
              className={styles.selection}
              style={{ ...box(layer), left: left + layer.x * z, top: top + layer.y * z }}
              onPointerDown={(event) => start(event, layer.id, null)}
            >
              {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => (
                <span
                  key={handle}
                  className={styles.handle}
                  data-handle={handle}
                  onPointerDown={(event) => start(event, layer.id, handle)}
                />
              ))}
              {(layer.w !== doc.w || layer.h !== doc.h) && (
                <span className={styles.size}>
                  {layer.w} × {layer.h}
                </span>
              )}
            </div>
          )}
          <div className={styles.badge} style={{ left: left + fw / 2, top: top + fh + 12 }}>
            <b>{formatName(doc)}</b>
            <span>
              {doc.w}×{doc.h}
            </span>
          </div>
        </>
      )}
      <Toaster events={engine?.events ?? null} />
    </div>
  );
}
