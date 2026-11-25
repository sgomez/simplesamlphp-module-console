// status 0: no answer could be read.
export interface Failed {
  status: number;
  body: unknown;
}

export type Result<T> = { ok: true; data: T } | ({ ok: false } & Failed);
