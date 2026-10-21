import { useReorder } from '../../components/engine/imageHooks';
import { Icon } from '../../components/Icon';
import { DeleteButton } from '../../components/resources/DeleteButton';
import { EditableText } from '../../components/resources/EditableText';
import styles from '../../components/resources/resources.module.css';
import { Empty, Section } from '../../components/resources/Section';
import {
  formatCmyk,
  formatRgb,
  isLight,
  neutralScale,
  normalizeHex,
  shadeScale,
} from '../../lib/resources/colors';
import { copyToClipboard, downloadBlob } from '../../lib/resources/download';
import { useDownloadAll } from '../../lib/resources/downloadAll';
import { useEditor } from '../../lib/resources/editor';
import { notify } from '../../lib/resources/events';
import { nearestPantone } from '../../lib/resources/pantone';
import { useCollection, type Entry } from '../../lib/resources/useCollection';
import page from './ColorPage.module.css';

// Page Couleur : palette principale, palette secondaire (couleurs d'accent), neutres construits
// à partir de deux couleurs opposées, nuances de chaque couleur de la palette, dégradés.
// On saisit un nom et un code HEX : RVB, CMJN et Pantone (le plus proche) sont calculés,
// et peuvent être corrigés à la main (CMJN et Pantone).
type Group = 'principale' | 'secondaire';
// « marque » et « neutres » : groupes de la première version, repris dans les palettes.
type Color = {
  group: Group | 'marque' | 'neutres';
  name: string;
  hex: string;
  cmyk?: string;
  pantone?: string;
};
type Neutrals = { light: string; dark: string };
type Gradient = { name: string; from: string; to: string; angle: number };

const groupOf = (color: Color): Group =>
  color.group === 'secondaire' || color.group === 'neutres' ? 'secondaire' : 'principale';

const PALETTES: { id: Group; title: string; hint: string }[] = [
  { id: 'principale', title: 'Palette de couleur principale', hint: 'Les couleurs qui portent la marque.' },
  {
    id: 'secondaire',
    title: 'Palette de couleur secondaire',
    hint: 'Les couleurs d’accent, en appui de la palette principale.',
  },
];

const HEX_ERROR = 'Code HEX non valable : 6 caractères, par exemple EC5F14.';
const cssName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const copy = async (value: string) =>
  notify((await copyToClipboard(value)) ? `Copié : ${value}` : 'La copie n’a pas été autorisée.');

/** Les valeurs d'une couleur, toutes copiables : HEX, RVB, CMJN, Pantone. */
function Values({ hex, cmyk, pantone }: { hex: string; cmyk?: string; pantone?: string }) {
  const rows = [
    ['HEX', hex],
    ['RVB', formatRgb(hex)],
    ['CMJN', cmyk || formatCmyk(hex)],
    ['Pantone', pantone || nearestPantone(hex)],
  ];
  return (
    <div className={page.values}>
      {rows.map(([label, value]) => (
        <button
          key={label}
          type="button"
          className={page.value}
          aria-label={`Copier ${label} ${value}`}
          title={
            label === 'Pantone' && !pantone ? 'Pantone le plus proche (à valider sur nuancier)' : undefined
          }
          onClick={() => copy(value)}
        >
          <span>{value}</span>
          <Icon name="square-behind-square2" size="xs" />
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onSave,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
}) {
  return (
    <label className={styles.fieldLabel}>
      <span>{label}</span>
      <EditableText value={value} label={label} editing onSave={onSave} placeholder={placeholder} />
    </label>
  );
}

function HexField({ label, value, onSave }: { label: string; value: string; onSave: (hex: string) => void }) {
  return (
    <Field
      label={label}
      value={value}
      placeholder="EC5F14"
      onSave={(next) => {
        const hex = normalizeHex(next);
        if (hex) onSave(hex);
        else notify(HEX_ERROR);
      }}
    />
  );
}

function ColorCard({
  color,
  editing,
  update,
  onDelete,
  drag,
}: {
  color: Entry<Color>;
  editing: boolean;
  update: (patch: Partial<Color>) => void;
  onDelete: () => void;
  drag: object;
}) {
  const hex = normalizeHex(color.hex);
  return (
    <li className={page.card} {...(editing ? drag : {})}>
      <div className={page.swatch} data-empty={!hex} style={hex ? { background: hex } : undefined} />
      <EditableText
        value={color.name}
        label="Nom de la couleur"
        editing={editing}
        onSave={(name) => update({ name })}
        className={page.name}
      />
      {editing ? (
        <div className={page.fields}>
          <HexField
            label={`Code HEX de ${color.name}`}
            value={color.hex}
            onSave={(next) => update({ hex: next })}
          />
          <Field
            label={`CMJN de ${color.name}`}
            value={color.cmyk ?? ''}
            placeholder={hex ? `Auto : ${formatCmyk(hex)}` : 'Calculé automatiquement'}
            onSave={(cmyk) => update({ cmyk })}
          />
          <Field
            label={`Pantone de ${color.name}`}
            value={color.pantone ?? ''}
            placeholder={hex ? `Auto : ${nearestPantone(hex)}` : 'Calculé automatiquement'}
            onSave={(pantone) => update({ pantone })}
          />
          <DeleteButton name={color.name} onDelete={onDelete} />
        </div>
      ) : (
        hex && <Values hex={hex} cmyk={color.cmyk} pantone={color.pantone} />
      )}
    </li>
  );
}

function GradientCard({
  gradient,
  editing,
  update,
  onDelete,
}: {
  gradient: Entry<Gradient>;
  editing: boolean;
  update: (patch: Partial<Gradient>) => void;
  onDelete: () => void;
}) {
  const from = normalizeHex(gradient.from),
    to = normalizeHex(gradient.to);
  const css = from && to ? `linear-gradient(${gradient.angle}deg, ${from}, ${to})` : '';
  return (
    <li className={page.card}>
      <div className={page.swatch} data-empty={!css} style={css ? { background: css } : undefined} />
      <EditableText
        value={gradient.name}
        label="Nom du dégradé"
        editing={editing}
        onSave={(name) => update({ name })}
        className={page.name}
      />
      {editing ? (
        <div className={page.fields}>
          <HexField
            label={`Couleur de départ de ${gradient.name}`}
            value={gradient.from}
            onSave={(hex) => update({ from: hex })}
          />
          <HexField
            label={`Couleur d’arrivée de ${gradient.name}`}
            value={gradient.to}
            onSave={(hex) => update({ to: hex })}
          />
          <Field
            label={`Angle de ${gradient.name} (degrés)`}
            value={String(gradient.angle)}
            onSave={(value) => update({ angle: Math.round(Number(value) || 0) % 360 })}
          />
          <DeleteButton name={gradient.name} onDelete={onDelete} />
        </div>
      ) : (
        css && (
          <div className={page.values}>
            <button
              type="button"
              className={page.value}
              aria-label={`Copier CSS ${css}`}
              onClick={() => copy(css)}
            >
              <span>{css}</span>
              <Icon name="square-behind-square2" size="xs" />
            </button>
          </div>
        )
      )}
    </li>
  );
}

/** Rangée de nuances : un clic copie le code. */
function Scale({ label, steps }: { label: string; steps: { step: number; hex: string }[] }) {
  return (
    <ul className={page.scale} aria-label={label}>
      {steps.map(({ step, hex }) => (
        <li key={step}>
          <button
            type="button"
            className={page.step}
            data-light={isLight(hex)}
            style={{ background: hex }}
            aria-label={`Copier ${label} ${step} ${hex}`}
            onClick={() => copy(hex)}
          >
            <span>{step}</span>
            <span>{hex}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ColorPage() {
  const { unlocked } = useEditor();
  const colors = useCollection<Color>('res-colors');
  const neutrals = useCollection<Neutrals>('res-neutrals');
  const gradients = useCollection<Gradient>('res-gradients');
  const reorder = useReorder(colors.move);

  const neutral = neutrals.items[0];
  const light = neutral && normalizeHex(neutral.light);
  const dark = neutral && normalizeHex(neutral.dark);
  const neutralSteps = light && dark ? neutralScale(light, dark) : null;
  const palette = PALETTES.flatMap((p) =>
    colors.items.filter((c) => groupOf(c) === p.id && normalizeHex(c.hex)),
  );

  // « Tout télécharger » : toutes les couleurs en variables CSS, prêtes à coller dans un site.
  const cssVariables = () => {
    const lines: string[] = [];
    for (const color of palette) {
      const name = cssName(color.name);
      lines.push(`  --${name}: ${normalizeHex(color.hex)};`);
      for (const { step, hex } of shadeScale(color.hex)) lines.push(`  --${name}-${step}: ${hex};`);
    }
    for (const { step, hex } of neutralSteps ?? []) lines.push(`  --neutre-${step}: ${hex};`);
    return `:root {\n${lines.join('\n')}\n}\n`;
  };
  useDownloadAll(
    'Télécharger la palette (CSS)',
    palette.length || neutralSteps
      ? async () => downloadBlob(new Blob([cssVariables()], { type: 'text/css' }), 'palette.css')
      : null,
  );

  // Les neutres sont un seul document : créé à la première saisie.
  const saveNeutral = (patch: Partial<Neutrals>) =>
    neutral ? neutrals.update(neutral.id, patch) : neutrals.add({ light: '', dark: '', ...patch });

  if (!colors.loaded || !neutrals.loaded || !gradients.loaded) return null;
  if (!colors.items.length && !neutralSteps && !gradients.items.length && !unlocked)
    return <Empty>Aucune couleur pour l’instant.</Empty>;

  return (
    <>
      {PALETTES.map((p) => {
        const list = colors.items.filter((c) => groupOf(c) === p.id);
        if (!list.length && !unlocked) return null;
        return (
          <Section
            key={p.id}
            title={p.title}
            actions={
              unlocked && (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => colors.add({ group: p.id, name: 'Nouvelle couleur', hex: '' })}
                >
                  <Icon name="plus-large" size="sm" /> Ajouter une couleur
                </button>
              )
            }
          >
            {list.length ? (
              <ul className={page.grid} aria-label={p.title}>
                {list.map((color) => (
                  <ColorCard
                    key={color.id}
                    color={color}
                    editing={unlocked}
                    drag={reorder(colors.items.indexOf(color))}
                    update={(patch) => colors.update(color.id, patch)}
                    onDelete={() => colors.remove(color.id, `Couleur supprimée : ${color.name}`)}
                  />
                ))}
              </ul>
            ) : (
              <Empty>{p.hint} Ajoute-les avec « Ajouter une couleur ».</Empty>
            )}
          </Section>
        );
      })}

      {(neutralSteps || unlocked) && (
        <Section title="Neutres">
          {unlocked && (
            <>
              <p className={page.hint}>
                Saisis tes deux couleurs opposées : la plus claire (50) et la plus foncée (950). Les paliers
                entre les deux se construisent seuls.
              </p>
              <div className={page.pairFields}>
                <HexField
                  label="Couleur claire des neutres"
                  value={neutral?.light ?? ''}
                  onSave={(hex) => saveNeutral({ light: hex })}
                />
                <HexField
                  label="Couleur foncée des neutres"
                  value={neutral?.dark ?? ''}
                  onSave={(hex) => saveNeutral({ dark: hex })}
                />
              </div>
            </>
          )}
          {neutralSteps ? (
            <ul className={page.gridSmall} aria-label="Neutres">
              {neutralSteps.map(({ step, hex }) => (
                <li key={step} className={page.card}>
                  <div className={page.swatch} data-small style={{ background: hex }} />
                  <span className={page.name}>Neutre {step}</span>
                  <Values hex={hex} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Les neutres apparaîtront ici dès que les deux couleurs seront saisies.</Empty>
          )}
        </Section>
      )}

      {palette.length > 0 && (
        <Section title="Nuances">
          <p className={page.hint}>
            Chaque couleur des palettes, éclaircie (50 à 400) et assombrie (600 à 950) ; 500 est la couleur
            d’origine.
          </p>
          <div className={page.shades}>
            {palette.map((color) => (
              <div key={color.id} className={page.shadeRow}>
                <span className={page.shadeName}>{color.name}</span>
                <Scale label={color.name} steps={shadeScale(color.hex)} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {(gradients.items.length > 0 || unlocked) && (
        <Section
          title="Dégradés"
          actions={
            unlocked && (
              <button
                type="button"
                className={styles.button}
                onClick={() => gradients.add({ name: 'Nouveau dégradé', from: '', to: '', angle: 90 })}
              >
                <Icon name="plus-large" size="sm" /> Ajouter un dégradé
              </button>
            )
          }
        >
          {gradients.items.length ? (
            <ul className={page.grid} aria-label="Dégradés">
              {gradients.items.map((gradient) => (
                <GradientCard
                  key={gradient.id}
                  gradient={gradient}
                  editing={unlocked}
                  update={(patch) => gradients.update(gradient.id, patch)}
                  onDelete={() => gradients.remove(gradient.id, `Dégradé supprimé : ${gradient.name}`)}
                />
              ))}
            </ul>
          ) : (
            <Empty>Aucun dégradé.</Empty>
          )}
        </Section>
      )}
    </>
  );
}
