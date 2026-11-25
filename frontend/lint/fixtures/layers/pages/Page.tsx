import { Button } from '../design-system/Button';
import { held } from '../domain/entities';
import { App } from '../app/App';

export function Page() {
  return <Button key={held} />;
}

export const app = App;
