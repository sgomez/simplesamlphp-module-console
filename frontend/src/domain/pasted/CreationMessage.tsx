import { Callout } from '../../design-system/Callout';
import { TextLink } from '../../design-system/TextLink';
import { editPath } from '../entities';
import { ReviewChanges } from '../publication';
import { ReportGroup } from './Report';
import type { Collision, CreationReport } from './types';

const COLLISION: Record<Collision, string> = { override: 'Override', shadowed: 'Shadowed' };

export function headline(report: CreationReport, verb: 'imported' | 'created'): string {
  const skipped = report.skipped.length;

  return `${report.created.length} ${verb}${skipped > 0 ? `, ${skipped} skipped` : ''}`;
}

// SPEC 9.5: the report of an Import, or of several entities created at once, as the one-shot message (ImportResult).
export function CreationMessage({ report, verb }: { report: CreationReport; verb: 'imported' | 'created' }) {
  const { set, created, skipped, converted, removable, shadowing, pending } = report;
  const removed = removable.reduce((sum, { entityIds }) => sum + entityIds.length, 0);

  return (
    <>
      <Callout kind="success" title={headline(report, verb)} action={pending > 0 && <ReviewChanges count={pending} variant="secondary" />} />
      {shadowing.map((heading) => (
        <Callout key={heading} kind="warning" title={`What was imported from ${heading} is Shadowed`}>
          Publishing changes nothing nodes serve until the originals are removed.
        </Callout>
      ))}
      {created.length > 0 && (
        <ReportGroup
          title={verb === 'imported' ? 'Imported' : 'Created'}
          lines={created.map(({ entityId, name, collision }) => ({
            key: entityId,
            name: <TextLink to={editPath(entityId, set)}>{name ?? entityId}</TextLink>,
            note: collision && COLLISION[collision],
          }))}
        />
      )}
      {skipped.length > 0 && (
        <ReportGroup title="Skipped" lines={skipped.map(({ entityId, name, reason }) => ({ key: entityId, name: name ?? entityId, note: reason }))} />
      )}
      {converted.length > 0 && (
        <ReportGroup title="Converted" lines={converted.map(({ option, note }) => ({ key: option, name: <span className="mono">{option}</span>, note }))} />
      )}
      {removable.length > 0 && (
        <ReportGroup
          title="You can now remove"
          count={removed}
          lines={removable.map(({ location, entityIds }) => ({
            key: location,
            name: <span className="mono">{location}</span>,
            note:
              entityIds.length === 0
                ? 'Nothing imported came from a file'
                : entityIds.map((id) => (
                    <span key={id} className="mono rep-id">
                      {id}
                    </span>
                  )),
          }))}
        />
      )}
    </>
  );
}
