import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { formatName, layoutStore, useLayout, type Layer, type PatternLayer } from '../../lib/layout/doc';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import { useEngine } from '../EditorPanel/useEngine';
import { Icon } from '../Icon';
import { Toaster } from '../Toaster';
import { AddLayerButtons } from './AddLayerButtons';
import styles from './LayoutStage.module.css';

// Plan de travail du Layout editor (Figma « Tool / Layout editor Motif ») : un frame sur la toile à
// points, son nom au-dessus, son format en dessous. Comme dans le prototype (Design libre, ligne 3798) :
// molette = se déplacer, ⌘ / Ctrl + molette ou pincement = zoomer, glisser le fond = se déplacer.
// Calques : glisser pour déplacer, coins pour redimensionner (Maj : proportions), flèches du clavier.
// Manipulation 3D d'un motif (double-clic ou bouton du panneau) : glisser le fait tourner,
// Maj + glisser le recadre, la molette zoome dedans.

// Barre d'espace tenue : glisser déplace la vue (un seul plan de travail à la fois).
const keys = { space: false };

const MARGIN = 72; // marge autour du frame ajusté, en pixels d'écran
const MIN_ZOOM = 0.02,
  MAX_ZOOM = 8;
type Handle = 'nw' | 'ne' | 'sw' | 'se';
type View = { s: number; x: number; y: number }; // échelle, position du coin du frame à l'écran
type Drag =
  | {
      kind: 'move' | 'resize';
      id: string;
      handle: Handle | null;
      x: number;
      y: number;
      box: Pick<Layer, 'x' | 'y' | 'w' | 'h'>;
    }
  | { kind: 'orbit' | 'crop'; id: string; x: number; y: number }
  | { kind: 'pan'; x: number; y: number; view: View; moved: boolean };

// libreTick (ligne 3765) : chaque calque de motif visible est dessiné par le moteur, à la taille
// où il est affiché (pixels de l'écran) : l'aperçu reste net quel que soit le zoom.
function createTick(engine: Engine, view: { current: View }) {
  let n = 0;
  return (dt: number) => {
    const bridge = engine.layout;
    if (bridge.exporting) return;
    n++;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cap = Math.min(4096, bridge.maxTexture);
    const list = layoutStore.doc.layers.filter(
      (l): l is PatternLayer => l.type === 'pattern' && !l.hidden && Boolean(l._cv),
    );
    const animated = list.filter((l) => l.anim).length;
    const every = animated > 2 ? Math.ceil(animated / 2) : 1;
    list.forEach((L, i) => {
      L._acc = (L._acc ?? 0) + dt;
      const cv = L._cv!;
      let pw = L.w * view.current.s * dpr,
        ph = L.h * view.current.s * dpr;
      const k = Math.min(1, cap / Math.max(pw, ph));
      pw = Math.max(16, Math.round(pw * k));
      ph = Math.max(16, Math.round(ph * k));
      // jamais agrandi à l'affichage de plus de 3 % : au-delà, le calque est recalculé
      if (cv.width < pw * 0.97 || cv.width > pw * 1.25 || Math.abs(cv.height / cv.width - ph / pw) > 0.01) {
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
  const { doc, layer, mode3d } = useLayout();
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [custom, setCustom] = useState<View | null>(null); // null : frame ajusté à l'écran
  const viewRef = useRef<View>({ s: 1, x: 0, y: 0 });
  const drag = useRef<Drag | null>(null);

  const fit: View = (() => {
    const s = size.w
      ? Math.max(MIN_ZOOM, Math.min((size.w - MARGIN * 2) / doc.w, (size.h - MARGIN * 2) / doc.h))
      : 1;
    return { s, x: (size.w - doc.w * s) / 2, y: (size.h - doc.h * s) / 2 };
  })();
  const view = custom ?? fit;
  useLayoutEffect(() => {
    viewRef.current = view;
  });

  // Le moteur passe en mode layout tant que la page est ouverte.
  useEffect(() => {
    if (!engine) return;
    engine.layout.enter(createTick(engine, viewRef));
    const onSettings = () => {
      if (engine.layout.live) {
        engine.layout.live.dirty = true;
        layoutStore.touch();
      }
    };
    engine.events.addEventListener('settings', onSettings);
    return () => {
      engine.events.removeEventListener('settings', onSettings);
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

  const zoomAt = (sx: number, sy: number, factor: number) => {
    const v = viewRef.current;
    const s = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.s * factor));
    setCustom({ s, x: sx - ((sx - v.x) * s) / v.s, y: sy - ((sy - v.y) * s) / v.s });
  };
  const zoomCenter = (factor: number) => zoomAt(size.w / 2, size.h / 2, factor);

  // Molette : écouteur non passif, pour que la page elle-même ne défile pas.
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const r = element.getBoundingClientRect();
      const sx = event.clientX - r.left,
        sy = event.clientY - r.top;
      const v = viewRef.current;
      const target = layoutStore.layer(layoutStore.selected);
      if (layoutStore.mode3d && target?.type === 'pattern') {
        const cx = v.x + (target.x + target.w / 2) * v.s,
          cy = v.y + (target.y + target.h / 2) * v.s;
        layoutStore.zoomInto(
          target.id,
          (sx - cx) / (target.w * v.s),
          (sy - cy) / (target.h * v.s),
          Math.exp(-event.deltaY * 0.004),
        );
      } else if (event.ctrlKey || event.metaKey) zoomAt(sx, sy, Math.exp(-event.deltaY * 0.0105));
      else
        setCustom({
          ...v,
          x: v.x - (event.shiftKey ? event.deltaY : event.deltaX),
          y: v.y - (event.shiftKey ? 0 : event.deltaY),
        });
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  const startPan = (event: PointerEvent) => {
    host.current?.setPointerCapture(event.pointerId);
    drag.current = { kind: 'pan', x: event.clientX, y: event.clientY, view: viewRef.current, moved: false };
  };

  const start = (event: PointerEvent, id: string, handle: Handle | null) => {
    event.stopPropagation();
    if (event.button === 1 || keys.space) return startPan(event);
    if (event.button !== 0) return;
    const target = layoutStore.layer(id);
    if (!target) return;
    if (id !== layoutStore.selected) layoutStore.select(id);
    host.current?.setPointerCapture(event.pointerId);
    if (layoutStore.mode3d && target.type === 'pattern' && !handle)
      drag.current = { kind: event.shiftKey ? 'crop' : 'orbit', id, x: event.clientX, y: event.clientY };
    else
      drag.current = {
        kind: handle ? 'resize' : 'move',
        id,
        handle,
        x: event.clientX,
        y: event.clientY,
        box: { ...target },
      };
  };

  // poignée d'angle : son coin est dans data-handle
  const startHandle = (event: PointerEvent<HTMLElement>) =>
    layoutStore.selected && start(event, layoutStore.selected, event.currentTarget.dataset.handle as Handle);

  const move = (event: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const v = viewRef.current;
    if (d.kind === 'pan') {
      const dx = event.clientX - d.x,
        dy = event.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      if (d.moved) setCustom({ ...d.view, x: d.view.x + dx, y: d.view.y + dy });
      return;
    }
    if (d.kind === 'orbit' || d.kind === 'crop') {
      const dx = event.clientX - d.x,
        dy = event.clientY - d.y;
      d.x = event.clientX;
      d.y = event.clientY;
      const target = layoutStore.layer(d.id);
      if (!target) return;
      if (d.kind === 'orbit') layoutStore.orbit(d.id, dx, dy);
      else layoutStore.panCrop(d.id, dx / (target.w * v.s), dy / (target.h * v.s));
      return;
    }
    if (d.kind !== 'move' && d.kind !== 'resize') return;
    const dx = (event.clientX - d.x) / v.s,
      dy = (event.clientY - d.y) / v.s;
    const { x, y, w, h } = d.box;
    if (d.kind === 'move') return layoutStore.updateLayer(d.id, { x: x + dx, y: y + dy });
    const west = d.handle!.includes('w'),
      north = d.handle!.includes('n');
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
    const d = drag.current;
    drag.current = null;
    if (host.current?.hasPointerCapture(event.pointerId)) host.current.releasePointerCapture(event.pointerId);
    // un simple clic sur le fond désélectionne
    if (d?.kind === 'pan' && !d.moved && event.button === 0 && !keys.space) layoutStore.select(null);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === ' ') {
      keys.space = true;
      event.preventDefault();
      return;
    }
    if (event.key === '+' || event.key === '=') return zoomCenter(1.25);
    if (event.key === '-') return zoomCenter(0.8);
    if (event.key === '0') return setCustom(null);
    if (event.key === 'Escape') {
      if (layoutStore.mode3d) layoutStore.set3d(false);
      else layoutStore.select(null);
      return;
    }
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
    }
  };

  const { s, x: left, y: top } = view;
  const fw = doc.w * s,
    fh = doc.h * s;
  const box = (l: Layer) => ({
    left: l.x * s,
    top: l.y * s,
    width: l.w * s,
    height: l.h * s,
    transform: `rotate(${l.r}deg)`,
  });
  const fill = doc.fill && engine ? engine.layout.hex[doc.fill] : undefined;
  const editing3d = mode3d && layer?.type === 'pattern';

  return (
    <div
      ref={host}
      className={styles.stage}
      tabIndex={0}
      data-mode={editing3d ? '3d' : undefined}
      aria-label={`Plan de travail : frame ${doc.name}, ${doc.w} × ${doc.h} px. Molette : se déplacer ; ⌘ ou Ctrl + molette, + et − : zoomer ; 0 : ajuster. Flèches : déplacer le calque choisi ; Suppr : le retirer.`}
      onPointerDown={startPan}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
      onKeyUp={(event) => {
        if (event.key === ' ') keys.space = false;
      }}
    >
      {size.w > 0 && (
        <>
          <div className={styles.frameName} style={{ left, top: top - 24, width: Math.max(fw, 80) }}>
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
                  style={{
                    ...box(l),
                    background: l.type === 'pattern' && l.bgOn && engine ? engine.layout.bgOf(l) : undefined,
                  }}
                  onPointerDown={(event) => start(event, l.id, null)}
                  onDoubleClick={() => l.type === 'pattern' && layoutStore.set3d(true)}
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
              data-mode={editing3d ? '3d' : undefined}
              style={{ ...box(layer), left: left + layer.x * s, top: top + layer.y * s }}
              onPointerDown={(event) => start(event, layer.id, null)}
              onDoubleClick={() => layer.type === 'pattern' && layoutStore.set3d(!mode3d)}
            >
              {!editing3d &&
                (['nw', 'ne', 'sw', 'se'] as const).map((handle) => (
                  <span
                    key={handle}
                    className={styles.handle}
                    data-handle={handle}
                    onPointerDown={startHandle}
                  />
                ))}
              {!editing3d && (layer.w !== doc.w || layer.h !== doc.h) && (
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

      {editing3d && (
        <p className={styles.hint}>
          Manipulation 3D · glisser pour tourner · Maj + glisser pour recadrer · molette pour zoomer · Échap
          pour terminer
        </p>
      )}

      <div
        className={styles.zoom}
        role="group"
        aria-label="Zoom du plan de travail"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button type="button" aria-label="Dézoomer" title="Dézoomer (−)" onClick={() => zoomCenter(0.8)}>
          <Icon name="minus-large" size="sm" />
        </button>
        <span aria-live="polite">{Math.round(s * 100)} %</span>
        <button type="button" aria-label="Zoomer" title="Zoomer (+)" onClick={() => zoomCenter(1.25)}>
          <Icon name="plus-large" size="sm" />
        </button>
        <button
          type="button"
          aria-label="Ajuster à l’écran"
          title="Ajuster à l’écran (0)"
          onClick={() => setCustom(null)}
        >
          <Icon name="expand-simple" size="sm" />
        </button>
      </div>
      <Toaster events={engine?.events ?? null} />
    </div>
  );
}
