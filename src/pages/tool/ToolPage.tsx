import type { ToolPageDef } from '../../app/navigation';
import { usePageTitle } from '../../app/usePageTitle';
import { EngineStage } from '../../components/engine/EngineStage';
import { LayoutStage } from '../../components/layout/LayoutStage';
import { Placeholder } from '../../components/Placeholder';

// Page Tool : la scène du moteur, ou un emplacement réservé tant que la page n'a pas son contenu.
// Le titre existe pour les lecteurs d'écran ; visuellement, les pages Tool n'en ont pas dans le Figma.
export function ToolPage({
  title,
  pending,
  engine,
  layout,
}: {
  title: string;
  pending: string;
  engine?: ToolPageDef['engine'];
  layout?: boolean;
}) {
  usePageTitle(title);
  return (
    <>
      <h1 className="visually-hidden">{title}</h1>
      {layout ? (
        <LayoutStage />
      ) : engine ? (
        <EngineStage mode={engine} />
      ) : (
        <Placeholder>{pending}</Placeholder>
      )}
    </>
  );
}
