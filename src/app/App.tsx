import { RouterProvider } from 'react-router';
import { router } from './router';
import { isDemoMode } from '../shared/demo';

export function App() {
  isDemoMode();
  return <RouterProvider router={router} />;
}
