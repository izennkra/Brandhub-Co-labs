import geistItalicUrl from '@fontsource-variable/geist/files/geist-latin-wght-italic.woff2?url';
import geistUrl from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import { useEffect } from 'react';
import { Icon } from '../../components/Icon';
import { DeleteButton } from '../../components/resources/DeleteButton';
import { DropZone } from '../../components/resources/DropZone';
import { EditableText } from '../../components/resources/EditableText';
import styles from '../../components/resources/resources.module.css';
import { Section } from '../../components/resources/Section';
import { copyToClipboard, downloadFile, downloadZip, slug } from '../../lib/resources/download';
import { useDownloadAll } from '../../lib/resources/downloadAll';
import { useEditor } from '../../lib/resources/editor';
import { notify } from '../../lib/resources/events';
import { removeResourceFile, saveResourceFile } from '../../lib/resources/files';
import { useCollection, type Entry } from '../../lib/resources/useCollection';
import page from './TypographyPage.module.css';

// Page Typographie (référence du Figma « Ressource / Typographie ») : la famille, ses fichiers
// à télécharger, puis l'échelle typographique. Par défaut : Geist, la police de l'appli.
// static : une graisse, à installer (TTF, OTF) ; variable : toutes les graisses dans un fichier ; web : WOFF2.
type FontKind = 'static' | 'variable' | 'web';
type FontFile = { label: string; url: string; filename: string; kind?: FontKind };
type Family = { name: string; role: string; weights: string; css: string; files: FontFile[] };
type Level = {
  name: string;
  weight: number;
  size: number;
  tracking: number;
  leading: number;
  sample: string;
};

// Fichiers de Geist (licence libre OFL, paquet officiel « geist ») : chaque variante en TTF, à installer,
// les versions variables, et les fichiers web de l'appli.
const GEIST = '/fonts/geist/';
const GEIST_STATICS = [
  ['Thin', 'Thin'],
  ['Thin Italic', 'ThinItalic'],
  ['ExtraLight', 'UltraLight'],
  ['ExtraLight Italic', 'ExtraLightItalic'],
  ['Light', 'Light'],
  ['Light Italic', 'LightItalic'],
  ['Regular', 'Regular'],
  ['Italic', 'Italic'],
  ['Medium', 'Medium'],
  ['Medium Italic', 'MediumItalic'],
  ['SemiBold', 'SemiBold'],
  ['SemiBold Italic', 'SemiBoldItalic'],
  ['Bold', 'Bold'],
  ['Bold Italic', 'BoldItalic'],
  ['ExtraBold Italic', 'ExtraBoldItalic'],
  ['Black', 'Black'],
  ['Black Italic', 'BlackItalic'],
  ['UltraBlack', 'UltraBlack'],
];

const DEFAULT_FAMILY: Family = {
  name: 'Geist',
  role: 'Principale — interface, titres et texte',
  weights: '400 Regular · 500 Medium · 600 Semibold · 700 Bold',
  css: "font-family: 'Geist', system-ui, sans-serif;",
  files: [
    ...GEIST_STATICS.map(([label, file]) => ({
      label: `Geist ${label}`,
      url: `${GEIST}Geist-${file}.ttf`,
      filename: `Geist-${file}.ttf`,
      kind: 'static' as const,
    })),
    {
      label: 'Geist Variable',
      url: `${GEIST}Geist-Variable.ttf`,
      filename: 'Geist-Variable.ttf',
      kind: 'variable',
    },
    {
      label: 'Geist Italic Variable',
      url: `${GEIST}Geist-Italic-Variable.ttf`,
      filename: 'Geist-Italic-Variable.ttf',
      kind: 'variable',
    },
    { label: 'Geist (web)', url: geistUrl, filename: 'geist-variable.woff2', kind: 'web' },
    {
      label: 'Geist Italic (web)',
      url: geistItalicUrl,
      filename: 'geist-variable-italic.woff2',
      kind: 'web',
    },
  ],
};

// Échelle par défaut : celle de la référence, en Geist.
const DEFAULT_SCALE: Level[] = [
  { name: 'Titre XXL', weight: 600, size: 72, tracking: -4, leading: 90, sample: 'Co-labs' },
  { name: 'Titre XL', weight: 600, size: 48, tracking: -4, leading: 90, sample: 'Construire ensemble' },
  { name: 'Titre L', weight: 600, size: 36, tracking: -3, leading: 100, sample: 'Construire ensemble' },
  { name: 'Titre M', weight: 600, size: 30, tracking: -3, leading: 100, sample: 'Construire ensemble' },
  { name: 'Titre S', weight: 500, size: 24, tracking: -2, leading: 110, sample: 'Construire ensemble' },
  {
    name: 'Texte',
    weight: 400,
    size: 16,
    tracking: 0,
    leading: 150,
    sample: 'Un texte courant, confortable à lire sur toutes les surfaces de la marque.',
  },
  {
    name: 'Légende',
    weight: 400,
    size: 12,
    tracking: 0,
    leading: 140,
    sample: 'Légende et petites mentions',
  },
];

const NUMBER_FIELDS = [
  { key: 'weight', label: 'Graisse', unit: '' },
  { key: 'size', label: 'Taille', unit: 'px' },
  { key: 'tracking', label: 'Interlettrage', unit: '%' },
  { key: 'leading', label: 'Interlignage', unit: '%' },
] as const;

const FILE_GROUPS: { kind: FontKind; title: string }[] = [
  { kind: 'static', title: 'Variantes à installer (une graisse par fichier)' },
  { kind: 'variable', title: 'Versions variables (toutes les graisses)' },
  { kind: 'web', title: 'Fichiers web (WOFF2)' },
];

const guessKind = (filename: string): FontKind =>
  /\.woff2?$/i.test(filename) ? 'web' : /variable|\[wght\]/i.test(filename) ? 'variable' : 'static';
const kindOf = (file: FontFile) => file.kind ?? guessKind(file.filename);

const downloadFamily = (family: Family) =>
  downloadZip(`${slug(family.name)}.zip`, [
    ...family.files.map((file) => ({ name: file.filename, data: file.url })),
    ...(family.name === 'Geist' ? [{ name: 'OFL.txt', data: `${GEIST}OFL.txt` }] : []),
  ]);

// Les polices déposées sont chargées pour que les exemples s'affichent dans la bonne police.
function useFontFaces(families: Family[]) {
  useEffect(() => {
    for (const family of families) {
      const file = family.files[0];
      if (!file || family.name === 'Geist') continue;
      const face = new FontFace(family.name, `url(${file.url})`);
      face
        .load()
        .then(() => document.fonts.add(face))
        .catch(() => undefined);
    }
  }, [families]);
}

function FamilyCards({
  family,
  editing,
  update,
  onDelete,
}: {
  family: Family;
  editing: boolean;
  update: ((patch: Partial<Family>) => void) | null;
  onDelete: (() => void) | null;
}) {
  const canEdit = editing && update !== null;
  const addFiles = async (files: File[]) => {
    const added: FontFile[] = [];
    for (const file of files) {
      try {
        const url = await saveResourceFile(file);
        added.push({
          label: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
          url,
          filename: file.name,
          kind: guessKind(file.name),
        });
      } catch {
        notify(`Impossible d’ajouter « ${file.name} ».`);
      }
    }
    if (added.length) update?.({ files: [...family.files, ...added] });
  };
  return (
    <div className={page.pair}>
      <article className={page.card}>
        <EditableText
          value={family.name}
          label="Nom de la police"
          editing={canEdit}
          onSave={(name) => update?.({ name })}
          className={page.family}
        />
        <EditableText
          value={family.role}
          label="Rôle de la police"
          editing={canEdit}
          onSave={(role) => update?.({ role })}
          className={page.muted}
        />
        {canEdit ? (
          <EditableText
            value={family.weights}
            label="Graisses"
            editing
            onSave={(weights) => update?.({ weights })}
          />
        ) : (
          <ul className={page.chips} aria-label="Graisses">
            {family.weights
              .split('·')
              .map((w) => w.trim())
              .filter(Boolean)
              .map((weight) => (
                <li key={weight} className={page.chip}>
                  {weight}
                </li>
              ))}
          </ul>
        )}
        {canEdit ? (
          <EditableText value={family.css} label="Code CSS" editing onSave={(css) => update?.({ css })} />
        ) : (
          <button
            type="button"
            className={page.code}
            aria-label="Copier le code CSS"
            onClick={async () =>
              notify(
                (await copyToClipboard(family.css)) ? 'Code CSS copié.' : 'La copie n’a pas été autorisée.',
              )
            }
          >
            <code>{family.css}</code>
            <Icon name="square-behind-square2" size="xs" />
          </button>
        )}
        {canEdit && onDelete && <DeleteButton name={`la police ${family.name}`} onDelete={onDelete} />}
      </article>
      <article className={page.card}>
        <h3 className={page.family}>Fichiers de police</h3>
        <p className={page.muted}>À installer pour le travail de création.</p>
        {FILE_GROUPS.map(({ kind, title }) => {
          const files = family.files
            .map((file, index) => ({ file, index }))
            .filter(({ file }) => kindOf(file) === kind);
          if (!files.length) return null;
          return (
            <div key={kind} className={page.fileGroup}>
              <h4 className={page.fileGroupTitle}>{title}</h4>
              <ul className={page.files}>
                {files.map(({ file, index }) => (
                  <li key={file.url} className={page.file}>
                    <button
                      type="button"
                      className={page.fileButton}
                      onClick={() => void downloadFile(file.url, file.filename)}
                      aria-label={`Télécharger ${file.label}`}
                    >
                      <Icon name="arrow-inbox" size="sm" />
                      {file.label}
                    </button>
                    {canEdit && (
                      <DeleteButton
                        name={file.label}
                        onDelete={() => {
                          void removeResourceFile(file.url);
                          update?.({ files: family.files.filter((_, i) => i !== index) });
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {family.files.length > 0 && (
          <button type="button" className={styles.primary} onClick={() => void downloadFamily(family)}>
            <Icon name="arrow-inbox" size="sm" /> Télécharger toute la famille (.zip)
          </button>
        )}
        {canEdit && (
          <DropZone
            accept=".woff2,.woff,.otf,.ttf"
            label="Dépose les fichiers de police (WOFF2, OTF, TTF)"
            onFiles={(files) => void addFiles(files)}
          />
        )}
      </article>
    </div>
  );
}

function LevelCard({
  level,
  fontFamily,
  editing,
  update,
  onDelete,
}: {
  level: Level;
  fontFamily: string;
  editing: boolean;
  update: (patch: Partial<Level>) => void;
  onDelete: () => void;
}) {
  return (
    <li className={page.level}>
      <div className={page.levelHead}>
        <EditableText
          value={level.name}
          label="Nom du niveau"
          editing={editing}
          onSave={(name) => update({ name })}
          className={page.levelName}
        />
        {NUMBER_FIELDS.map(({ key, label, unit }) =>
          editing ? (
            <label key={key} className={page.tagField}>
              <span>{label}</span>
              <EditableText
                value={String(level[key])}
                label={`${label} de ${level.name}`}
                editing
                onSave={(value) => {
                  const n = Number(value.replace(',', '.'));
                  if (Number.isFinite(n)) update({ [key]: n });
                }}
              />
            </label>
          ) : (
            <span key={key} className={page.tag}>
              {label} {level[key]}
              {unit}
            </span>
          ),
        )}
        {editing && <DeleteButton name={level.name} onDelete={onDelete} />}
      </div>
      {editing ? (
        <EditableText
          value={level.sample}
          label={`Exemple de ${level.name}`}
          editing
          onSave={(sample) => update({ sample })}
        />
      ) : (
        <p
          className={page.sample}
          style={{
            fontFamily,
            fontWeight: level.weight,
            fontSize: level.size,
            letterSpacing: `${level.tracking / 100}em`,
            lineHeight: `${level.leading}%`,
          }}
        >
          {level.sample}
        </p>
      )}
    </li>
  );
}

export function TypographyPage() {
  const { unlocked } = useEditor();
  const families = useCollection<Family>('res-fonts');
  const scale = useCollection<Level>('res-type-scale');
  const familyList: (Family | Entry<Family>)[] = families.items.length ? families.items : [DEFAULT_FAMILY];
  const levels: (Level | Entry<Level>)[] = scale.items.length ? scale.items : DEFAULT_SCALE;
  const fontFamily = `'${familyList[0].name}', var(--font-sans)`;
  useFontFaces(familyList);

  useDownloadAll('Télécharger toutes les polices (.zip)', async () => {
    for (const family of familyList) await downloadFamily(family);
  });

  // En mode édition, on part d'une copie modifiable de Geist si rien n'a encore été enregistré.
  const seedFamilies = () => families.add(DEFAULT_FAMILY, 'Police modifiable : tu peux la changer.');
  const seedScale = async () => {
    for (const level of DEFAULT_SCALE) await scale.add(level);
  };

  if (!families.loaded || !scale.loaded) return null;

  return (
    <>
      <Section
        title="Famille de police"
        actions={
          unlocked &&
          (families.items.length ? (
            <button
              type="button"
              className={styles.button}
              onClick={() => families.add({ ...DEFAULT_FAMILY, files: [] })}
            >
              <Icon name="plus-large" size="sm" /> Ajouter une police
            </button>
          ) : (
            <button type="button" className={styles.button} onClick={seedFamilies}>
              Modifier la police
            </button>
          ))
        }
      >
        {familyList.map((family) => {
          const stored = 'id' in family ? family : null;
          return (
            <FamilyCards
              key={stored?.id ?? 'defaut'}
              family={family}
              editing={unlocked}
              update={stored ? (patch) => families.update(stored.id, patch) : null}
              onDelete={stored ? () => families.remove(stored.id, `Police supprimée : ${family.name}`) : null}
            />
          );
        })}
      </Section>
      <Section
        title="Échelle typographique"
        actions={
          unlocked &&
          (scale.items.length ? (
            <button
              type="button"
              className={styles.button}
              onClick={() => scale.add({ ...DEFAULT_SCALE[5], name: 'Nouveau niveau' })}
            >
              <Icon name="plus-large" size="sm" /> Ajouter un niveau
            </button>
          ) : (
            <button type="button" className={styles.button} onClick={() => void seedScale()}>
              Modifier l’échelle
            </button>
          ))
        }
      >
        <ul className={page.levels}>
          {levels.map((level) => {
            const stored = 'id' in level ? level : null;
            return (
              <LevelCard
                key={stored?.id ?? level.name}
                level={level}
                fontFamily={fontFamily}
                editing={unlocked && stored !== null}
                update={(patch) => stored && scale.update(stored.id, patch)}
                onDelete={() => stored && scale.remove(stored.id, `Niveau supprimé : ${level.name}`)}
              />
            );
          })}
        </ul>
      </Section>
    </>
  );
}
