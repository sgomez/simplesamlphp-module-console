const MODULE = '/module.php/console';

export function consoleBase(pathname: string): string {
  const at = pathname.indexOf(MODULE);

  return at === -1 ? '' : pathname.slice(0, at + MODULE.length);
}

function consoleUrl(path: string): string {
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

// Every API call goes through here: a 401 means the session is gone, and a reload lets core ask for login.
export async function requestJson<T>(
  path: string,
  init: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> } = {},
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(consoleUrl(`/api${path}`), {
      ...init,
      headers: { Accept: 'application/json', ...init.headers },
      credentials: 'same-origin',
    });
  } catch {
    return { ok: false, status: 0, body: null };
  }
  if (response.status === 401) {
    location.reload();
  }
  const { read, body } = await bodyOf(response);
  if (!response.ok || !read) {
    return { ok: false, status: response.status, body };
  }

  return { ok: true, data: body as T };
}

export function getJson<T>(path: string): Promise<ApiResult<T>> {
  return requestJson<T>(path);
}

function token(): string {
  return document.querySelector<HTMLMetaElement>('meta[name="console-token"]')?.content ?? '';
}

export function postJson<T>(path: string, body: object): Promise<ApiResult<T>> {
  return requestJson<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Console-Token': token() },
    body: JSON.stringify(body),
  });
}
