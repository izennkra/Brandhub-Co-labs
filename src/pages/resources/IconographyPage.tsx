import { useState } from 'react';
import { DeleteButton } from '../../components/resources/DeleteButton';
import { DropZone } from '../../components/resources/DropZone';
import styles from '../../components/resources/resources.module.css';
import { Empty } from '../../components/resources/Section';
import { normalizeHex } from '../../lib/resources/colors';
import { copyToClipboard, downloadBlob, slug } from '../../lib/resources/download';
import { useDownloadAll } from '../../lib/resources/downloadAll';
import { useEditor } from '../../lib/resources/editor';
import { notify } from '../../lib/resources/events';
import { readAsText } from '../../lib/resources/files';
import { sizedSvg } from '../../lib/resources/svg';
import { useCollection } from '../../lib/resources/useCollection';
import page from './IconographyPage.module.css';

// Page Iconographie (Figma « Ressource / Iconographie ») : filtres à gauche (recherche, taille,
// couleur), grille des icônes de la marque à droite. Un clic copie le SVG à la taille et à la couleur choisies.
type IconItem = { name: string; svg: string };
type BrandColor = { name: string; hex: string };

const ICON_SIZES = [16, 20, 24, 32, 40];

const svgUrl = (svg: string) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;

function agentInstructions(icons: IconItem[], size: number) {
  return [
    '# Icônes de la marque Co-labs',
    '',
    `Utilise uniquement ces icônes (${icons.length}), en SVG en ligne, sans autre bibliothèque.`,
    `- Taille par défaut : ${size} px ; garder les proportions.`,
    '- Couleur : « currentColor », héritée du texte autour.',
    '- Bouton avec icône seule : un aria-label ; icône décorative : aria-hidden="true".',
    '',
    '## Liste',
    ...icons.map((icon) => `- ${icon.name}`),
  ].join('\n');
}

export function IconographyPage() {
  const { unlocked } = useEditor();
  const icons = useCollection<IconItem>('res-icons');
  const colors = useCollection<BrandColor>('res-colors');
  const [query, setQuery] = useState('');
  const [size, setSize] = useState(24);
  const [color, setColor] = useState('');
  const hex = normalizeHex(color);
  const shown = icons.items.filter((icon) => icon.name.toLowerCase().includes(query.trim().toLowerCase()));
  const brand = colors.items.filter((c) => normalizeHex(c.hex));

  useDownloadAll(
    'Télécharger toutes les icônes (SVG)',
    icons.items.length
      ? async () => {
          for (const icon of icons.items)
            downloadBlob(
              new Blob([sizedSvg(icon.svg, size, hex)], { type: 'image/svg+xml' }),
              `${slug(icon.name)}.svg`,
            );
        }
      : null,
  );

  const addIcons = async (files: File[]) => {
    for (const file of files) {
      const svg = await readAsText(file);
      if (!/<svg[\s>]/i.test(svg)) {
        notify(`« ${file.name} » n’est pas un SVG.`);
        continue;
      }
      await icons.add({ name: file.name.replace(/\.svg$/i, ''), svg });
    }
    notify(files.length > 1 ? `${files.length} icônes ajoutées.` : 'Icône ajoutée.');
  };

  const copyIcon = async (icon: IconItem) =>
    notify(
      (await copyToClipboard(sizedSvg(icon.svg, size, hex)))
        ? `SVG copié : ${icon.name}`
        : 'La copie n’a pas été autorisée.',
    );

  if (!icons.loaded) return null;

  return (
    <div className={page.layout}>
      <div className={page.filters}>
        <label className={page.filter}>
          <span className={page.filterTitle}>Recherche</span>
          <input
            type="search"
            className={styles.field}
            placeholder="Chercher une icône"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className={page.filter}>
          <span className={page.filterTitle} id="icon-size">
            Taille
          </span>
          <div className={page.segmented} role="group" aria-labelledby="icon-size">
            {ICON_SIZES.map((s) => (
              <button key={s} type="button" aria-pressed={s === size} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className={page.filter}>
          <label className={page.filterTitle} htmlFor="icon-color">
            Couleur
          </label>
          <input
            id="icon-color"
            type="text"
            className={styles.field}
            placeholder="Code HEX, vide = couleur du texte"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
          {brand.length > 0 && (
            <div className={page.swatches} role="group" aria-label="Couleurs de la marque">
              {brand.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={page.swatch}
                  style={{ background: normalizeHex(c.hex)! }}
                  aria-label={c.name}
                  aria-pressed={hex === normalizeHex(c.hex)}
                  title={c.name}
                  onClick={() => setColor(normalizeHex(c.hex)!)}
                />
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className={styles.button}
          disabled={!icons.items.length}
          onClick={async () =>
            notify(
              (await copyToClipboard(agentInstructions(icons.items, size)))
                ? 'Instructions copiées.'
                : 'La copie n’a pas été autorisée.',
            )
          }
        >
          Copier les instructions pour agent
        </button>
      </div>

      <div className={page.results}>
        <p className={page.count}>
          {shown.length} icône{shown.length > 1 ? 's' : ''} · un clic copie le SVG
        </p>
        {unlocked && (
          <DropZone
            accept=".svg,image/svg+xml"
            label="Dépose tes icônes SVG ici"
            onFiles={(f) => void addIcons(f)}
          />
        )}
        {shown.length === 0 ? (
          <Empty>{icons.items.length ? 'Aucune icône ne correspond.' : 'Aucune icône pour l’instant.'}</Empty>
        ) : (
          <ul className={page.grid} aria-label="Icônes">
            {shown.map((icon) => (
              <li key={icon.id} className={page.cell}>
                <button
                  type="button"
                  className={page.icon}
                  aria-label={`Copier le SVG de ${icon.name}`}
                  onClick={() => void copyIcon(icon)}
                >
                  <span
                    className={page.glyph}
                    aria-hidden="true"
                    style={{
                      width: size,
                      height: size,
                      maskImage: svgUrl(icon.svg),
                      WebkitMaskImage: svgUrl(icon.svg),
                      ...(hex ? { background: hex } : {}),
                    }}
                  />
                  <span className={page.iconName}>{icon.name}</span>
                </button>
                {unlocked && <DeleteButton name={icon.name} onDelete={() => icons.remove(icon.id)} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
