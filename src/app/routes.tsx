import { Navigate, type RouteObject } from 'react-router';
import { ResourcePage } from '../pages/resources/ResourcePage';
import { ToolPage } from '../pages/tool/ToolPage';
import { AppLayout } from './AppLayout';
import { RESOURCE_PAGES, TOOL_PAGES } from './navigation';
import { ResourceLayout } from './ResourceLayout';
import { ToolLayout } from './ToolLayout';

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
          element: <ToolPage title={page.label} pending={page.pending} engine={page.engine} />,
        })),
      },
      {
        element: <ResourceLayout />,
        children: RESOURCE_PAGES.map((page) => ({
          path: toRoute(page.path),
          element: <ResourcePage title={page.label} description={page.description} />,
        })),
      },
      { path: '*', element: <Navigate to={TOOL_PAGES[0].path} replace /> },
    ],
  },
];
