import { useReorder } from '../../components/engine/imageHooks';
import { Icon } from '../../components/Icon';
import { DeleteButton } from '../../components/resources/DeleteButton';
import { DropZone } from '../../components/resources/DropZone';
import { EditableText } from '../../components/resources/EditableText';
import styles from '../../components/resources/resources.module.css';
import { Empty, Section } from '../../components/resources/Section';
import { downloadBlob, slug, svgToPng } from '../../lib/resources/download';
import { useDownloadAll } from '../../lib/resources/downloadAll';
import { useEditor } from '../../lib/resources/editor';
import { notify } from '../../lib/resources/events';
import { readAsText } from '../../lib/resources/files';
import { useCollection, type Entry } from '../../lib/resources/useCollection';

// Page Logo (Figma « Ressource / Logo ») : des groupes (« Logo », « Logo symbole »…) de cartes à
// télécharger. Chaque logo est déposé une fois en SVG ; le PNG est fabriqué au téléchargement.
type Group = { name: string };
type Logo = { groupId: string; name: string; svg: string; dark?: boolean };

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
// « logo-noir_v2.svg » → « Logo noir v2 »
const nameFromFile = (file: string) => {
  const base = file
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
};

const downloadSvg = (logo: Logo) =>
  downloadBlob(new Blob([logo.svg], { type: 'image/svg+xml' }), `${slug(logo.name)}.svg`);
const downloadPng = async (logo: Logo) => downloadBlob(await svgToPng(logo.svg), `${slug(logo.name)}.png`);

function LogoCard({
  logo,
  editing,
  onRename,
  onToggleDark,
  onDelete,
  drag,
}: {
  logo: Entry<Logo>;
  editing: boolean;
  onRename: (name: string) => void;
  onToggleDark: () => void;
  onDelete: () => void;
  drag: object;
}) {
  return (
    <li className={styles.card} {...(editing ? drag : {})}>
      <div className={styles.preview} data-dark={Boolean(logo.dark)}>
        <img src={svgUrl(logo.svg)} alt={logo.name} />
      </div>
      <EditableText
        value={logo.name}
        label={`Nom du logo ${logo.name}`}
        editing={editing}
        onSave={onRename}
        className={styles.cardName}
      />
      <div className={styles.cardActions}>
        <button
          type="button"
          className={styles.light}
          aria-label={`Télécharger ${logo.name} en SVG`}
          onClick={() => downloadSvg(logo)}
        >
          SVG <Icon name="arrow-inbox" size="sm" />
        </button>
        <button
          type="button"
          className={styles.light}
          aria-label={`Télécharger ${logo.name} en PNG`}
          onClick={() =>
            void downloadPng(logo).catch(() => notify('Ce SVG ne peut pas être converti en PNG.'))
          }
        >
          PNG <Icon name="arrow-inbox" size="sm" />
        </button>
        {editing && (
          <>
            <button
              type="button"
              className={styles.light}
              aria-pressed={Boolean(logo.dark)}
              onClick={onToggleDark}
            >
              Fond foncé
            </button>
            <DeleteButton name={logo.name} onDelete={onDelete} />
          </>
        )}
      </div>
    </li>
  );
}

export function LogoPage() {
  const { unlocked } = useEditor();
  const groups = useCollection<Group>('res-logo-groups');
  const logos = useCollection<Logo>('res-logos');
  const reorder = useReorder(logos.move);

  useDownloadAll(
    'Télécharger tous les logos (SVG)',
    logos.items.length
      ? async () => {
          for (const logo of logos.items) downloadSvg(logo);
        }
      : null,
  );

  const addLogos = async (groupId: string, files: File[]) => {
    for (const file of files) {
      const svg = await readAsText(file);
      if (!/<svg[\s>]/i.test(svg)) {
        notify(`« ${file.name} » n’est pas un SVG.`);
        continue;
      }
      await logos.add(
        { groupId, name: nameFromFile(file.name), svg },
        `Logo ajouté : ${nameFromFile(file.name)}`,
      );
    }
  };

  if (!groups.loaded || !logos.loaded) return null;
  if (!groups.items.length && !unlocked) return <Empty>Aucun logo pour l’instant.</Empty>;

  return (
    <>
      {groups.items.map((group) => {
        const inGroup = logos.items.filter((logo) => logo.groupId === group.id);
        return (
          <Section
            key={group.id}
            title={
              <EditableText
                value={group.name}
                label="Nom du groupe"
                editing={unlocked}
                onSave={(name) => groups.update(group.id, { name })}
              />
            }
            actions={
              unlocked && (
                <DeleteButton
                  name={`le groupe ${group.name}`}
                  onDelete={async () => {
                    for (const logo of inGroup) await logos.remove(logo.id);
                    await groups.remove(group.id, `Groupe supprimé : ${group.name}`);
                  }}
                />
              )
            }
          >
            {inGroup.length === 0 && !unlocked ? (
              <Empty>Aucun logo dans ce groupe.</Empty>
            ) : (
              <ul className={styles.grid} aria-label={group.name}>
                {inGroup.map((logo) => (
                  <LogoCard
                    key={logo.id}
                    logo={logo}
                    editing={unlocked}
                    drag={reorder(logos.items.indexOf(logo))}
                    onRename={(name) => logos.update(logo.id, { name })}
                    onToggleDark={() => logos.update(logo.id, { dark: !logo.dark })}
                    onDelete={() => logos.remove(logo.id, `Logo supprimé : ${logo.name}`)}
                  />
                ))}
                {unlocked && (
                  <li>
                    <DropZone
                      accept=".svg,image/svg+xml"
                      label="Dépose tes logos SVG ici, ou clique pour les choisir"
                      onFiles={(files) => void addLogos(group.id, files)}
                    />
                  </li>
                )}
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
            onClick={() =>
              groups.add({ name: groups.items.length ? 'Nouveau groupe' : 'Logo' }, 'Groupe ajouté')
            }
          >
            <Icon name="plus-large" size="sm" /> Nouveau groupe
          </button>
        </div>
      )}
    </>
  );
}
