import type { Draft, EditedEntity, EntitiesPort, PastedFormat, SaveResult, Validation } from '../../../domain/entities';
import type { Failed, Result } from '../../../lib/result';
import { travelbooker } from './added';
import { formCapabilities } from './forms';
import { phpOf } from './translate';

export interface MemoryEditing {
  entities?: EditedEntity[];
  starter?: EditedEntity;
  // What a save answers; by default the text is stored as sent.
  save?: (draft: Draft, stored: EditedEntity | undefined) => SaveResult;
  validate?: (php: string) => Validation;
  // Reading never answers.
  reading?: boolean;
  // Only what the API serves today: no capability of SPEC that waits for it.
  served?: boolean;
  // What the operations the API does not serve yet answer, in place of their result.
  failing?: Failed;
  // What reading pasted configuration answers; by default the board's Travelbooker.
  pasted?: (text: string, format: PastedFormat) => Result<EditedEntity>;
}

type Editing = Omit<EntitiesPort, 'list' | 'remove'>;

const clean: Validation = { errors: [], notices: [], warnings: [], readable: true };

function missing<T>(): Result<T> {
  return { ok: false, status: 404, body: { error: 'not found' } };
}

export function memoryEditing({ entities = [], starter, save, validate, reading, served, failing, pasted }: MemoryEditing): Editing {
  const stored = new Map(entities.map((entity) => [entity.entityId, entity]));
  // What the translator gave, both ways, so that a document and its PHP find each other again.
  const documents = new Map(entities.flatMap((entity) => (entity.document && entity.php ? [[entity.php, entity.document] as const] : [])));
  const keep = (entity: EditedEntity): Result<EditedEntity> => {
    stored.set(entity.entityId, entity);

    return { ok: true, data: entity };
  };
  const change = (entityId: string, more: (entity: EditedEntity) => Partial<EditedEntity>): Result<EditedEntity> => {
    const entity = stored.get(entityId);
    if (failing) {
      return { ok: false, ...failing };
    }

    return entity ? keep({ ...entity, ...more(entity), version: entity.version + 1 }) : missing();
  };

  const editing: Editing = {
    read: async (entityId) => {
      if (reading) {
        return new Promise(() => undefined);
      }
      const entity = stored.get(entityId);

      return entity ? { ok: true, data: entity } : missing();
    },
    starter: async () => (starter ? { ok: true, data: starter } : missing()),
    save: async (draft) => {
      const entity = 'entityId' in draft ? stored.get(draft.entityId) : undefined;
      const answer: SaveResult = save
        ? save(draft, entity)
        : entity
          ? {
              kind: 'saved',
              entity: {
                ...entity,
                php: draft.php,
                ...(documents.has(draft.php) && { document: documents.get(draft.php) ?? {} }),
                version: entity.version + 1,
                state: entity.state === 'Up to date' ? 'Modified' : entity.state,
              },
            }
          : { kind: 'failed', failed: { status: 404, body: null } };
      if (answer.kind === 'saved' || answer.kind === 'race') {
        stored.set(answer.entity.entityId, answer.entity);
      }

      return answer;
    },
    validate: async (_entityId, php) => ({ ok: true, data: validate ? validate(php) : clean }),
  };
  if (served) {
    return editing;
  }

  return {
    ...editing,
    setEnabled: async (entityId, enabled) =>
      change(entityId, (entity) => ({ enabled, state: enabled || entity.state !== 'Up to date' ? entity.state : 'To be withdrawn' })),
    discard: async (entityId) =>
      change(entityId, (entity) => (entity.state === 'Unpublished' ? { enabled: false, state: 'Not live' } : { enabled: true, state: 'Up to date' })),
    promote: async (entityId) => change(entityId, () => ({ nextKey: false, state: 'Modified' })),
    replacePath: (entityId) => `/entities/saml20-sp-remote/replace?entityid=${encodeURIComponent(entityId)}`,
    hideTidied: () => undefined,
    readPasted: async (text, format) => (pasted ? pasted(text, format) : { ok: true, data: travelbooker }),
    form: formCapabilities,
    view: async (request) => {
      const id = request.entityId ?? '';
      if ('document' in request) {
        const php = phpOf(id, request.document);
        documents.set(php, request.document);

        return { ok: true, data: { php, document: request.document } };
      }
      const check = validate?.(request.php);
      if (check && !check.readable) {
        return { ok: false, status: 422, body: check };
      }
      const document = documents.get(request.php) ?? stored.get(id)?.document ?? {};

      return { ok: true, data: { php: request.php, document } };
    },
  };
}
