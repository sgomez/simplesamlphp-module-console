import { useLoad, type Loaded } from '../session';
import { useAuthsourcesPort, type AuthsourceList } from './port';

export function useAuthsources(): Loaded<AuthsourceList> {
  const port = useAuthsourcesPort();

  return useLoad('authsources', () => port.list());
}
