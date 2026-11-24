export interface Session {
  identity: string;
  adminUrl: string;
  logoutUrl: string;
  pendingCount: number;
}

export interface EntityLabel {
  text: string;
  kind: 'disabled' | 'warning';
  title: string | null;
}

export interface EntityRow {
  entityId: string;
  name: string | null;
  state: string | null;
  labels: EntityLabel[];
  unreadable: boolean;
  error: string | null;
}

export interface EntityPage {
  rows: EntityRow[];
  total: number;
  page: number;
  pages: number;
  perPage: number;
  query: string;
}
