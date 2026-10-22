import { Navigate, type RouteObject } from 'react-router';
import { ColorPage } from '../pages/resources/ColorPage';
import { IconographyPage } from '../pages/resources/IconographyPage';
import { ImageryPage } from '../pages/resources/ImageryPage';
import { InspirationPage } from '../pages/resources/InspirationPage';
import { LogoPage } from '../pages/resources/LogoPage';
import { PatternsPage } from '../pages/resources/PatternsPage';
import { ResourcePage } from '../pages/resources/ResourcePage';
import { TypographyPage } from '../pages/resources/TypographyPage';
import { ToolPage } from '../pages/tool/ToolPage';
import { AppLayout } from './AppLayout';
import { RESOURCE_PAGES, TOOL_PAGES } from './navigation';
import { ResourceLayout } from './ResourceLayout';
import { ToolLayout } from './ToolLayout';

const toRoute = (path: string) => path.slice(1);

// Contenu de chaque page Ressource.
const RESOURCE_CONTENT: Record<string, () => React.ReactNode> = {
  '/ressources/logo': LogoPage,
  '/ressources/typographie': TypographyPage,
  '/ressources/couleur': ColorPage,
  '/ressources/iconographie': IconographyPage,
  '/ressources/imagerie': ImageryPage,
  '/ressources/patterns': PatternsPage,
  '/ressources/inspiration': InspirationPage,
};

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={TOOL_PAGES[0].path} replace /> },
      {
        element: <ToolLayout />,
        children: TOOL_PAGES.map((page) => ({
          path: toRoute(page.path),
          element: <ToolPage title={page.label} pending={page.pending} engine={page.engine} />,
        })),
      },
      {
        element: <ResourceLayout />,
        children: RESOURCE_PAGES.map((page) => {
          const Content = RESOURCE_CONTENT[page.path];
          return {
            path: toRoute(page.path),
            element: (
              <ResourcePage title={page.label} description={page.description}>
                {Content && <Content />}
              </ResourcePage>
            ),
          };
        }),
      },
      { path: '*', element: <Navigate to={TOOL_PAGES[0].path} replace /> },
    ],
  },
];
