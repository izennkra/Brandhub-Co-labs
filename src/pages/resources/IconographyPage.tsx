import { useEffect, useState } from 'react';
import styles from '../../components/resources/resources.module.css';
import { Empty, Section } from '../../components/resources/Section';
import { normalizeHex } from '../../lib/resources/colors';
import { copyToClipboard } from '../../lib/resources/download';
import { notify } from '../../lib/resources/events';
import {
  agentInstructions,
  CORNERS,
  ICON_API,
  ICON_SIZES,
  iconSvgUrl,
  searchIcons,
  STROKES,
  variantId,
  type IconOptions,
  type IconResult,
} from '../../lib/resources/icons';
import { useCollection } from '../../lib/resources/useCollection';
import page from './IconographyPage.module.css';

// Page Iconographie (Figma « Ressource / Iconographie ») : toute la bibliothèque Central, comme
// l'explorateur de visual.systems. Filtres à gauche (recherche, style, arrondi, trait, couleur, taille),
// grille à droite ; un clic copie l'icône. En bas : le lien d'intégration pour les développeurs.
type BrandColor = { name: string; hex: string };
type CopyFormat = 'svg' | 'jsx' | 'url';

const COPY_FORMATS: { id: CopyFormat; label: string }[] = [
  { id: 'svg', label: 'SVG' },
  { id: 'jsx', label: 'JSX' },
  { id: 'url', label: 'lien' },
];

function Choice<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = String,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
}) {
  return (
    <div className={page.filter}>
      <span className={page.filterTitle} id={`icons-${label}`}>
        {label}
      </span>
      <div className={page.segmented} role="group" aria-labelledby={`icons-${label}`}>
        {options.map((option) => (
          <button key={option} type="button" aria-pressed={option === value} onClick={() => onChange(option)}>
            {format(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

type Results = { icons: IconResult[]; total: number; next: number | null };

export function IconographyPage() {
  const colors = useCollection<BrandColor>('res-colors');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [options, setOptions] = useState<IconOptions>({
    style: 'outlined',
    corner: 2,
    stroke: 1.5,
    size: 24,
  });
  const [color, setColor] = useState('');
  const [format, setFormat] = useState<CopyFormat>('svg');
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const hex = normalizeHex(color);
  const variant = variantId(options);
  const brand = colors.items.filter((c) => normalizeHex(c.hex));
  const set = <K extends keyof IconOptions>(key: K, value: IconOptions[K]) =>
    setOptions((current) => ({ ...current, [key]: value }));

  // recherche 250 ms après la dernière frappe
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    searchIcons(debounced, variant, 0)
      .then((found) => {
        if (cancelled) return;
        setResults({ icons: found.icons, total: found.total, next: found.nextOffset });
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, variant]);

  const loadMore = async () => {
    if (!results?.next) return;
    setLoadingMore(true);
    try {
      const more = await searchIcons(debounced, variant, results.next);
      setResults({ icons: [...results.icons, ...more.icons], total: more.total, next: more.nextOffset });
    } catch {
      notify('La bibliothèque d’icônes ne répond pas.');
    }
    setLoadingMore(false);
  };

  const copyIcon = async (icon: IconResult) => {
    const url = iconSvgUrl(icon.name, variant, options.size, hex);
    let text = url;
    if (format !== 'url') {
      try {
        const source = format === 'svg' ? url : `${ICON_API}/central/${icon.name}.jsx?variant=${variant}`;
        const response = await fetch(source);
        if (!response.ok) throw new Error('icône introuvable');
        text = await response.text();
      } catch {
        notify('La bibliothèque d’icônes ne répond pas.');
        return;
      }
    }
    notify(
      (await copyToClipboard(text))
        ? `${icon.name} copiée (${format === 'url' ? 'lien' : format.toUpperCase()})`
        : 'La copie n’a pas été autorisée.',
    );
  };

  const integrationUrl = iconSvgUrl('NOM', variant, options.size, hex).replace('/NOM.svg', '/{nom}.svg');

  return (
    <>
      <div className={page.layout}>
        <div className={page.filters}>
          <label className={page.filter}>
            <span className={page.filterTitle}>Recherche</span>
            <input
              type="search"
              className={styles.field}
              placeholder="En anglais : arrow, trash, user…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <Choice
            label="Style"
            options={['outlined', 'filled'] as const}
            value={options.style}
            onChange={(v) => set('style', v)}
            format={(v) => (v === 'outlined' ? 'Trait' : 'Plein')}
          />
          <Choice
            label="Arrondi"
            options={CORNERS}
            value={options.corner}
            onChange={(v) => set('corner', v)}
            format={(v) => `${v} px`}
          />
          <Choice
            label="Épaisseur"
            options={STROKES}
            value={options.stroke}
            onChange={(v) => set('stroke', v)}
            format={(v) => `${String(v).replace('.', ',')} px`}
          />
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
                {brand.map((c) => {
                  const value = normalizeHex(c.hex)!;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={page.swatch}
                      style={{ background: value }}
                      aria-label={c.name}
                      aria-pressed={hex === value}
                      title={c.name}
                      onClick={() => setColor(hex === value ? '' : value)}
                    />
                  );
                })}
              </div>
            )}
          </div>
          <Choice label="Taille" options={ICON_SIZES} value={options.size} onChange={(v) => set('size', v)} />
          <button
            type="button"
            className={styles.button}
            onClick={async () =>
              notify(
                (await copyToClipboard(agentInstructions(variant, options.size)))
                  ? 'Instructions copiées.'
                  : 'La copie n’a pas été autorisée.',
              )
            }
          >
            Copier les instructions pour agent
          </button>
        </div>

        <div className={page.results}>
          <div className={page.resultsHead}>
            <p className={page.count}>
              Central · {options.style === 'outlined' ? 'Trait' : 'Plein'}
              {results ? ` · ${results.total} icône${results.total > 1 ? 's' : ''}` : ''}
            </p>
            <div className={page.segmented} role="group" aria-label="Format de copie">
              {COPY_FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={f.id === format}
                  onClick={() => setFormat(f.id)}
                >
                  Copier en {f.label}
                </button>
              ))}
            </div>
          </div>
          {error ? (
            <Empty>La bibliothèque d’icônes ne répond pas. Réessaie dans un instant.</Empty>
          ) : !results ? (
            <Empty>Chargement des icônes…</Empty>
          ) : results.icons.length === 0 ? (
            <Empty>Aucune icône ne correspond. Essaie un mot en anglais.</Empty>
          ) : (
            <>
              <ul className={page.grid} aria-label="Icônes">
                {results.icons.map((icon) => (
                  <li key={icon.name} className={page.cell}>
                    <button
                      type="button"
                      className={page.icon}
                      aria-label={`Copier ${icon.name}`}
                      title={`Copier ${icon.name}`}
                      onClick={() => void copyIcon(icon)}
                    >
                      <img
                        src={iconSvgUrl(icon.name, variant, options.size, hex)}
                        alt=""
                        width={options.size}
                        height={options.size}
                        loading="lazy"
                      />
                      <span className={page.iconName}>{icon.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {results.next !== null && (
                <button
                  type="button"
                  className={styles.button}
                  disabled={loadingMore}
                  onClick={() => void loadMore()}
                >
                  {loadingMore
                    ? 'Chargement…'
                    : `Voir plus (${results.total - results.icons.length} restantes)`}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <Section title="Intégration pour les développeurs">
        <p className={page.hint}>
          Chaque icône s’obtient par un lien : remplace {'{nom}'} par le nom affiché sous l’icône. Les
          réglages choisis ci-dessus (style, arrondi, épaisseur, taille, couleur) sont déjà dans le lien.
        </p>
        <button
          type="button"
          className={page.code}
          aria-label="Copier le lien d’intégration"
          onClick={async () =>
            notify(
              (await copyToClipboard(integrationUrl)) ? 'Lien copié.' : 'La copie n’a pas été autorisée.',
            )
          }
        >
          <code>{integrationUrl}</code>
        </button>
        <p className={page.hint}>
          Guide complet pour les développeurs et les agents :{' '}
          <a href="https://visual.systems/modules/icon/llms.txt" target="_blank" rel="noreferrer">
            visual.systems/modules/icon/llms.txt
          </a>
        </p>
      </Section>
    </>
  );
}
