import { useRoutes } from 'react-router-dom';
import { FullPageLoading } from './components/Feedback';
import { useApp } from './context/AppContext';
import { routes } from './routes';

export function App() {
  const { ready } = useApp();
  const element = useRoutes(routes);
  if (!ready) return <FullPageLoading />;
  return element;
}
