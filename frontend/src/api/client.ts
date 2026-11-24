const MODULE = '/module.php/console';

export function consoleBase(pathname: string): string {
  const at = pathname.indexOf(MODULE);

  return at === -1 ? '' : pathname.slice(0, at + MODULE.length);
}

export function consoleUrl(path: string): string {
  return consoleBase(window.location.pathname) + path;
}

// status 0: no response could be read at all.
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; body: unknown };

async function bodyOf(response: Response): Promise<{ read: boolean; body: unknown }> {
  try {
    return { read: true, body: (await response.json()) as unknown };
  } catch {
    return { read: false, body: null };
  }
}

export async function getJson<T>(path: string): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(consoleUrl(`/api${path}`), {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
  } catch {
    return { ok: false, status: 0, body: null };
  }
  const { read, body } = await bodyOf(response);
  if (!response.ok || !read) {
    return { ok: false, status: response.status, body };
  }

  return { ok: true, data: body as T };
}
