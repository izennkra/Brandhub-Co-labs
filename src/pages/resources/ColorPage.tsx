import { useReorder } from '../../components/engine/imageHooks';
import { Icon } from '../../components/Icon';
import { DeleteButton } from '../../components/resources/DeleteButton';
import { EditableText } from '../../components/resources/EditableText';
import styles from '../../components/resources/resources.module.css';
import { Empty, Section } from '../../components/resources/Section';
import {
  formatHsl,
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
import { useCollection, type Entry } from '../../lib/resources/useCollection';
import page from './ColorPage.module.css';

// Page Couleur : palette principale, palette secondaire (couleurs d'accent), neutres construits
// à partir de deux couleurs opposées, nuances de chaque couleur de la palette, dégradés.
// On saisit un nom et un code HEX ; RVB et TSL sont calculés, CMJN et Pantone sont facultatifs.
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
  { id: 'principale', title: 'Palette principale', hint: 'Les couleurs qui portent la marque.' },
  {
    id: 'secondaire',
    title: 'Palette secondaire',
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

function CopyValue({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      className={page.value}
      aria-label={`Copier ${label} ${value}`}
      onClick={() => copy(value)}
    >
      <span className={page.valueLabel}>{label}</span>
      <span>{value}</span>
      <Icon name="square-behind-square2" size="xs" />
    </button>
  );
}

function HexField({ label, value, onSave }: { label: string; value: string; onSave: (hex: string) => void }) {
  return (
    <label className={styles.fieldLabel}>
      <span>{label}</span>
      <EditableText
        value={value}
        label={label}
        editing
        onSave={(next) => {
          const hex = normalizeHex(next);
          if (hex) onSave(hex);
          else notify(HEX_ERROR);
        }}
      />
    </label>
  );
}

/** Rangée de paliers (neutres, nuances) : un clic copie le code. */
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
          <label className={styles.fieldLabel}>
            <span>CMJN (facultatif)</span>
            <EditableText
              value={color.cmyk ?? ''}
              label={`CMJN de ${color.name}`}
              editing
              onSave={(cmyk) => update({ cmyk })}
            />
          </label>
          <label className={styles.fieldLabel}>
            <span>Pantone (facultatif)</span>
            <EditableText
              value={color.pantone ?? ''}
              label={`Pantone de ${color.name}`}
              editing
              onSave={(pantone) => update({ pantone })}
            />
          </label>
          <DeleteButton name={color.name} onDelete={onDelete} />
        </div>
      ) : (
        hex && (
          <div className={page.values}>
            <CopyValue label="HEX" value={hex} />
            <CopyValue label="RVB" value={formatRgb(hex)} />
            <CopyValue label="TSL" value={formatHsl(hex)} />
            {color.cmyk && <CopyValue label="CMJN" value={color.cmyk} />}
            {color.pantone && <CopyValue label="Pantone" value={color.pantone} />}
          </div>
        )
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
          <label className={styles.fieldLabel}>
            <span>Angle (degrés)</span>
            <EditableText
              value={String(gradient.angle)}
              label={`Angle de ${gradient.name}`}
              editing
              onSave={(value) => update({ angle: Math.round(Number(value) || 0) % 360 })}
            />
          </label>
          <DeleteButton name={gradient.name} onDelete={onDelete} />
        </div>
      ) : (
        css && (
          <div className={page.values}>
            <CopyValue label="CSS" value={css} />
          </div>
        )
      )}
    </li>
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
            <p className={page.hint}>{p.hint}</p>
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
              <Empty>Aucune couleur dans cette palette.</Empty>
            )}
          </Section>
        );
      })}

      {(neutralSteps || unlocked) && (
        <Section title="Neutres">
          <p className={page.hint}>
            Construits à partir de deux couleurs opposées : la plus claire (50) et la plus foncée (950).
          </p>
          {unlocked && (
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
          )}
          {neutralSteps ? (
            <Scale label="Neutre" steps={neutralSteps} />
          ) : (
            <Empty>Saisis la couleur claire et la couleur foncée : les neutres se construisent seuls.</Empty>
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
