import { usePageTitle } from '../../app/usePageTitle';
import { Placeholder } from '../../components/Placeholder';

// Page Tool en attente de son contenu. Le titre existe pour les lecteurs d'écran ;
// visuellement, les pages Tool n'en ont pas dans le Figma.
export function ToolPage({ title, pending }: { title: string; pending: string }) {
  usePageTitle(title);
  return (
    <>
      <h1 className="visually-hidden">{title}</h1>
      <Placeholder>{pending}</Placeholder>
    </>
  );
}
