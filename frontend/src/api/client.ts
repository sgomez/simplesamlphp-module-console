const MODULE = '/module.php/console';

export function consoleBase(pathname: string): string {
  const at = pathname.indexOf(MODULE);

  return at === -1 ? '' : pathname.slice(0, at + MODULE.length);
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number };

export async function getJson<T>(path: string): Promise<ApiResult<T>> {
  const response = await fetch(`${consoleBase(window.location.pathname)}/api${path}`, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });
  if (!response.ok) {
    return { ok: false, status: response.status };
  }

  return { ok: true, data: (await response.json()) as T };
}

export function consoleUrl(path: string): string {
  return consoleBase(window.location.pathname) + path;
}
