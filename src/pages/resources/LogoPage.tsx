import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { DeleteButton } from '../../components/resources/DeleteButton';
import { DropZone } from '../../components/resources/DropZone';
import { EditableText } from '../../components/resources/EditableText';
import styles from '../../components/resources/resources.module.css';
import { Empty, Section } from '../../components/resources/Section';
import { downloadBlob, downloadZip, slug } from '../../lib/resources/download';
import { useEditor } from '../../lib/resources/editor';
import { notify } from '../../lib/resources/events';
import { readAsText } from '../../lib/resources/files';
import {
  brandLogoColors,
  LOGO_FORMATS,
  logoFileName,
  logoVariants,
  logoZipEntries,
  renderLogo,
  sanitizeSvg,
  versionLabel,
  type LogoFormat,
  type LogoVariant,
} from '../../lib/resources/logo';
import { useCollection } from '../../lib/resources/useCollection';

// Page Logo (Figma « Ressource / Logo ») : une section par déclinaison (logo principal, symbole…).
// Le logo est déposé une seule fois en SVG ; il est décliné dans chaque couleur de la marque
// (page Couleur), toujours sur fond transparent ; chaque version s'exporte en SVG, PNG ou PDF,
// avec un nom de fichier composé automatiquement (section, couleur).
type LogoSection = { name: string; svg?: string };
type Color = { name: string; hex: string; group?: string };
type Neutrals = { light: string; dark: string };

// Sections proposées d'office ; d'autres s'ajoutent au besoin.
const DEFAULT_SECTIONS = [
  { id: 'principal', name: 'Logo principal' },
  { id: 'symbole', name: 'Symbole' },
];

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

async function downloadVariant(section: string, variant: LogoVariant, format: LogoFormat) {
  try {
    downloadBlob(await renderLogo(variant, format), logoFileName(section, variant, format));
  } catch {
    notify(`Ce logo ne peut pas être exporté en ${format.toUpperCase()}.`);
  }
}

/** Toutes les versions d'une ou plusieurs sections, dans les trois formats, en un .zip. */
async function zipVariants(zipName: string, sections: { name: string; variants: LogoVariant[] }[]) {
  await downloadZip(zipName, await logoZipEntries(sections));
}

function VariantCard({ section, variant }: { section: string; variant: LogoVariant }) {
  const label = `${section} ${versionLabel(variant)}`;
  return (
    <li className={styles.card}>
      <div className={styles.preview} data-dark={variant.dark} data-transparent="true">
        <img src={svgUrl(variant.svg)} alt={label} />
      </div>
      <span className={styles.cardName} title={`${section} — ${versionLabel(variant)}`}>
        {section} — {versionLabel(variant)}
      </span>
      <div className={styles.cardActions}>
        {LOGO_FORMATS.map((format) => (
          <button
            key={format}
            type="button"
            className={styles.light}
            aria-label={`Télécharger ${label} en ${format.toUpperCase()}`}
            onClick={() => void downloadVariant(section, variant, format)}
          >
            {format.toUpperCase()} <Icon name="arrow-inbox" size="sm" />
          </button>
        ))}
      </div>
    </li>
  );
}

export function LogoPage() {
  const { unlocked } = useEditor();
  const sections = useCollection<LogoSection>('res-logo-groups');
  const colors = useCollection<Color>('res-colors');
  const neutrals = useCollection<Neutrals>('res-neutrals');
  const [zipping, setZipping] = useState<string | null>(null);

  const brand = brandLogoColors(colors.items, neutrals.items[0]);

  // Les sections enregistrées, sinon celles proposées d'office (créées au premier dépôt).
  const list: (LogoSection & { id: string })[] = sections.items.length ? sections.items : DEFAULT_SECTIONS;
  const withLogo = list
    .filter((s) => s.svg)
    .map((s) => ({ name: s.name, variants: logoVariants(s.svg!, brand) }));

  const saveSection = (id: string, patch: Partial<LogoSection>) => {
    const stored = sections.items.find((s) => s.id === id);
    if (stored) return sections.update(id, patch);
    // première modification : les sections par défaut sont enregistrées
    return Promise.all(
      DEFAULT_SECTIONS.map((s) =>
        sections.set(s.id, s.id === id ? { name: s.name, ...patch } : { name: s.name }),
      ),
    );
  };

  const upload = async (id: string, name: string, files: File[]) => {
    const file = files[0];
    const svg = file && sanitizeSvg(await readAsText(file));
    if (!svg || !/<svg[\s>]/i.test(svg)) return notify(`« ${file?.name ?? 'Ce fichier'} » n’est pas un SVG.`);
    await saveSection(id, { svg });
    notify(`${name} : logo ajouté et décliné dans les couleurs de la marque.`);
  };

  if (!sections.loaded || !colors.loaded || !neutrals.loaded) return null;
  if (!withLogo.length && !unlocked) return <Empty>Aucun logo pour l’instant.</Empty>;

  return (
    <>
      {!brand.length && (
        <p className={styles.empty}>
          Ajoute les couleurs de la marque (page Couleur) : chaque logo y sera décliné automatiquement.
        </p>
      )}
      {list.map((section) => {
        const svg = section.svg;
        if (!svg && !unlocked) return null;
        const variants = svg ? logoVariants(svg, brand) : [];
        const isDefault = DEFAULT_SECTIONS.some((s) => s.id === section.id);
        return (
          <Section
            key={section.id}
            title={
              <EditableText
                value={section.name}
                label="Nom de la section"
                editing={unlocked}
                onSave={(name) => saveSection(section.id, { name })}
              />
            }
            actions={
              <>
                {svg && (
                  <button
                    type="button"
                    className={styles.button}
                    disabled={zipping !== null}
                    onClick={async () => {
                      setZipping(section.id);
                      await zipVariants(`${slug(section.name)}.zip`, [{ name: section.name, variants }]);
                      setZipping(null);
                    }}
                  >
                    <Icon name="arrow-inbox" size="sm" />
                    {zipping === section.id ? 'Préparation…' : 'Toutes les versions (.zip)'}
                  </button>
                )}
                {unlocked && !isDefault && (
                  <DeleteButton
                    name={`la section ${section.name}`}
                    onDelete={() => sections.remove(section.id, `Section supprimée : ${section.name}`)}
                  />
                )}
              </>
            }
          >
            {unlocked && (
              <DropZone
                accept=".svg,image/svg+xml"
                multiple={false}
                label={
                  svg
                    ? `Remplacer le SVG de « ${section.name} »`
                    : `Dépose le SVG de « ${section.name} » (une seule fois, il sera décliné)`
                }
                onFiles={(files) => void upload(section.id, section.name, files)}
              />
            )}
            {variants.length > 0 && (
              <ul className={styles.grid} aria-label={section.name}>
                {variants.map((variant) => (
                  <VariantCard key={versionLabel(variant)} section={section.name} variant={variant} />
                ))}
              </ul>
            )}
          </Section>
        );
      })}
      {unlocked && (
        <div>
          <button
            type="button"
            className={styles.button}
            onClick={async () => {
              if (!sections.items.length)
                await Promise.all(DEFAULT_SECTIONS.map((s) => sections.set(s.id, { name: s.name })));
              await sections.add({ name: 'Nouvelle section' }, 'Section ajoutée');
            }}
          >
            <Icon name="plus-large" size="sm" /> Ajouter une section
          </button>
        </div>
      )}
    </>
  );
}
