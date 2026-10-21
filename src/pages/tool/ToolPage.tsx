import { usePageTitle } from '../../app/usePageTitle';
import { EngineStage } from '../../components/engine/EngineStage';
import { Placeholder } from '../../components/Placeholder';

// Page Tool : la scène du moteur, ou un emplacement réservé tant que la page n'a pas son contenu.
// Le titre existe pour les lecteurs d'écran ; visuellement, les pages Tool n'en ont pas dans le Figma.
export function ToolPage({ title, pending, engine }: { title: string; pending: string; engine?: 'motif' }) {
  usePageTitle(title);
  return (
    <>
      <h1 className="visually-hidden">{title}</h1>
      {engine ? <EngineStage /> : <Placeholder>{pending}</Placeholder>}
    </>
  );
}
