import { Page } from '../pages/Page';
import { held } from '../domain/entities';
import { one } from '../lib/one';

export function App() {
  return <Page key={held + one} />;
}
