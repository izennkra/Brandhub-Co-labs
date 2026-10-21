import { useReorder } from '../../components/engine/imageHooks';
import { Icon } from '../../components/Icon';
import { DeleteButton } from '../../components/resources/DeleteButton';
import { EditableText } from '../../components/resources/EditableText';
import styles from '../../components/resources/resources.module.css';
import { Empty, Section } from '../../components/resources/Section';
import { formatHsl, formatRgb, normalizeHex } from '../../lib/resources/colors';
import { copyToClipboard, downloadBlob } from '../../lib/resources/download';
import { useDownloadAll } from '../../lib/resources/downloadAll';
import { useEditor } from '../../lib/resources/editor';
import { notify } from '../../lib/resources/events';
import { useCollection, type Entry } from '../../lib/resources/useCollection';
import page from './ColorPage.module.css';

// Page Couleur (référence du Figma « Ressource / Couleur ») : couleurs de marque, neutres et dégradés.
// On saisit un nom et un code HEX ; RVB et TSL sont calculés, CMJN et Pantone sont facultatifs.
type Color = { group: 'marque' | 'neutres'; name: string; hex: string; cmyk?: string; pantone?: string };
type Gradient = { name: string; from: string; to: string; angle: number };

const GROUPS = [
  { id: 'marque', title: 'Couleurs de marque' },
  { id: 'neutres', title: 'Neutres' },
] as const;

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
          <label className={styles.fieldLabel}>
            <span>HEX</span>
            <EditableText
              value={color.hex}
              label={`Code HEX de ${color.name}`}
              editing
              onSave={(value) => {
                const next = normalizeHex(value);
                if (next) update({ hex: next });
                else notify('Code HEX non valable : 6 caractères, par exemple EC5F14.');
              }}
            />
          </label>
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
          {(['from', 'to'] as const).map((key) => (
            <label key={key} className={styles.fieldLabel}>
              <span>{key === 'from' ? 'Couleur de départ' : 'Couleur d’arrivée'}</span>
              <EditableText
                value={gradient[key]}
                label={`${key === 'from' ? 'Couleur de départ' : 'Couleur d’arrivée'} de ${gradient.name}`}
                editing
                onSave={(value) => {
                  const next = normalizeHex(value);
                  if (next) update({ [key]: next });
                  else notify('Code HEX non valable : 6 caractères, par exemple EC5F14.');
                }}
              />
            </label>
          ))}
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
  const gradients = useCollection<Gradient>('res-gradients');
  const reorder = useReorder(colors.move);

  // « Tout télécharger » : les couleurs en variables CSS, prêtes à coller dans un site.
  const named = colors.items.filter((c) => normalizeHex(c.hex));
  useDownloadAll(
    'Télécharger la palette (CSS)',
    named.length
      ? async () => {
          const lines = named.map(
            (c) => `  --${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}: ${normalizeHex(c.hex)};`,
          );
          downloadBlob(new Blob([`:root {\n${lines.join('\n')}\n}\n`], { type: 'text/css' }), 'palette.css');
        }
      : null,
  );

  if (!colors.loaded || !gradients.loaded) return null;
  if (!colors.items.length && !gradients.items.length && !unlocked)
    return <Empty>Aucune couleur pour l’instant.</Empty>;

  return (
    <>
      {GROUPS.map((group) => {
        const list = colors.items.filter((c) => c.group === group.id);
        if (!list.length && !unlocked) return null;
        return (
          <Section
            key={group.id}
            title={group.title}
            actions={
              unlocked && (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => colors.add({ group: group.id, name: 'Nouvelle couleur', hex: '' })}
                >
                  <Icon name="plus-large" size="sm" /> Ajouter une couleur
                </button>
              )
            }
          >
            {list.length ? (
              <ul className={page.grid} aria-label={group.title}>
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
              <Empty>Aucune couleur dans ce groupe.</Empty>
            )}
          </Section>
        );
      })}
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
