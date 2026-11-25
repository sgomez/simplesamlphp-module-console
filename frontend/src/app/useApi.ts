import { useLoad, type Loaded } from '../domain/session';
import { getJson } from './http/client';

export type ApiState<T> = Loaded<T>;

interface ApiOptions {
  entityId?: string;
  revision?: number;
}

export function useApi<T>(path: string, options: ApiOptions = {}): ApiState<T> {
  return useLoad(path, () => getJson<T>(path), options);
}
