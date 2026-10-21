import { Navigate, type RouteObject } from 'react-router';
import { ResourcePage } from '../pages/resources/ResourcePage';
import { ToolPage } from '../pages/tool/ToolPage';
import { AppLayout } from './AppLayout';
import { RESOURCE_PAGES, TOOL_PAGES } from './navigation';
import { ResourceLayout } from './ResourceLayout';
import { ToolLayout } from './ToolLayout';

// Texte affiché en attendant le contenu de chaque page (parties suivantes de CAPABILITY-MAP.md).
const TOOL_PENDING: Record<string, string> = {
  '/outils/motif': 'Le moteur de motifs arrive avec la partie pattern-engine.',
  '/outils/illustration': 'Les illustrations arrivent avec la partie pattern-engine.',
  '/outils/layout-editor': 'Le Layout editor arrive avec la partie layout-editor.',
};

// Descriptions provisoires, à remplacer par les textes définitifs dans la partie resources.
const RESOURCE_DESCRIPTIONS: Record<string, string> = {
  '/ressources/logo': 'Les logos de la marque, prêts à télécharger.',
  '/ressources/typographie': 'Les polices de la marque, leurs graisses et leur hiérarchie.',
  '/ressources/couleur': 'La palette de la marque et ses valeurs à copier.',
  '/ressources/iconographie': 'Les icônes de la marque, à rechercher et à copier.',
  '/ressources/imagerie': 'Les images et la direction photo de la marque.',
  '/ressources/patterns': 'Les motifs prêts à l’emploi, générés avec l’outil.',
  '/ressources/inspiration': 'Les références visuelles qui nourrissent la marque.',
};

const toRoute = (path: string) => path.slice(1);

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={TOOL_PAGES[0].path} replace /> },
      {
        element: <ToolLayout />,
        children: TOOL_PAGES.map((page) => ({
          path: toRoute(page.path),
          element: <ToolPage title={page.label} pending={TOOL_PENDING[page.path]} />,
        })),
      },
      {
        element: <ResourceLayout />,
        children: RESOURCE_PAGES.map((page) => ({
          path: toRoute(page.path),
          element: <ResourcePage title={page.label} description={RESOURCE_DESCRIPTIONS[page.path]} />,
        })),
      },
      { path: '*', element: <Navigate to={TOOL_PAGES[0].path} replace /> },
    ],
  },
];
