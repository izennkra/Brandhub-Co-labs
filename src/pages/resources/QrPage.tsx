import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { loadEngine } from '../../lib/pattern-engine/loadEngine';
import { drawQr, qrMatrix, qrName, qrPath, qrSide } from '../../lib/resources/qr';
import styles from './QrPage.module.css';

// Page Ressource › QR code (design validé le 22/10/2026) : un lien, un nom, l'aperçu net du QR, puis
// « Styliser dans l'Illustration » : le QR rejoint la liste des illustrations (tons, pastilles,
// animation, apparition, disparition, taille…) et l'outil s'ouvre dessus. Enregistrer l'y garde pour tous.
export function QrPage() {
  const navigate = useNavigate();
  const [link, setLink] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const matrix = useMemo(() => qrMatrix(link), [link]);
  const ready = !('error' in matrix);

  const stylize = async () => {
    if ('error' in matrix) return;
    setBusy(true);
    setFailed(false);
    try {
      const blob = await new Promise<Blob | null>((resolve) => drawQr(matrix).toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('image vide');
      const file = new File([blob], `${name.trim() || qrName(link)}.png`, { type: 'image/png' });
      const engine = await loadEngine();
      // l'Illustration charge sa bibliothèque une fois affichée : on l'ouvre, puis le QR la rejoint
      navigate('/outils/illustration');
      for (let wait = 0; !engine.library.loaded && wait < 300; wait++)
        await new Promise((resolve) => setTimeout(resolve, 100));
      if (!engine.library.loaded) throw new Error('bibliothèque non chargée');
      await engine.actions.addImages([file]);
      // le QR à l'écran tout de suite, même quand les illustrations défilent en boucle
      const { core } = engine;
      const index = core.imgList.length - 1;
      engine.actions.pickImage(index);
      const place = core.loopList().indexOf(index);
      if (core.S.imgLoop && place >= 0)
        core.imgTime = place * (Number(core.S.imgHold) + Number(core.S.imgTrans));
    } catch (error) {
      console.error(error);
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <div className={styles.card}>
      <label className={styles.field}>
        <span className={styles.label}>Lien</span>
        <input
          className={styles.input}
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={link}
          onChange={(event) => setLink(event.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Nom</span>
        <input
          className={styles.input}
          placeholder={qrName(link)}
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <div className={styles.preview}>
        {ready ? (
          <svg
            className={styles.code}
            viewBox={`0 0 ${qrSide(matrix)} ${qrSide(matrix)}`}
            shapeRendering="crispEdges"
            role="img"
            aria-label={`QR code de ${link.trim()}`}
          >
            <rect width="100%" height="100%" fill="white" />
            <path d={qrPath(matrix)} fill="black" />
          </svg>
        ) : (
          <p className={styles.empty} aria-live="polite">
            {matrix.error}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} disabled={!ready || busy} onClick={stylize}>
          {busy ? 'Ouverture de l’Illustration…' : 'Styliser dans l’Illustration'}
        </button>
        <p className={styles.note} aria-live="polite">
          {failed
            ? 'Le QR n’a pas pu être envoyé. Réessaie dans un instant.'
            : 'Le QR rejoint la liste des illustrations ; « Enregistrer » l’y garde pour tous. Garde un flou et une dispersion légers pour qu’il reste lisible.'}
        </p>
      </div>
    </div>
  );
}
