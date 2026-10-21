import { Navigate, type RouteObject } from 'react-router';
import { ToolPage } from '../pages/tool/ToolPage';
import { AppLayout } from './AppLayout';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/outils/motif" replace /> },
      {
        path: 'outils/motif',
        element: (
          <ToolPage title="Motif" pending="Le moteur de motifs arrive avec la partie pattern-engine." />
        ),
      },
      {
        path: 'outils/illustrations',
        element: (
          <ToolPage
            title="Illustrations iconographique"
            pending="Les illustrations arrivent avec la partie pattern-engine."
          />
        ),
      },
      {
        path: 'outils/layout-editor',
        element: (
          <ToolPage title="Layout editor" pending="Le Layout editor arrive avec la partie layout-editor." />
        ),
      },
      { path: '*', element: <Navigate to="/outils/motif" replace /> },
    ],
  },
];
