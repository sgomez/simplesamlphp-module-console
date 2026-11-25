import { Callout } from '../design-system/Callout';
import { Page } from '../design-system/Page';
import {
  ChangeList,
  Done,
  Failed,
  MovedNotice,
  NodeList,
  Nothing,
  Problems,
  PublishPanel,
  useDiscard,
  usePublish,
  Warnings,
} from '../domain/publication';

// onChange: a Publication or a discard changed what the session answers.
export function PublishPage({ onChange }: { onChange: () => void }) {
  const publish = usePublish(onChange);
  const discard = useDiscard(publish);
  const { review, moved, outcome, nodes } = publish;

  if (outcome?.kind === 'published') {
    return (
      <Page>
        <h1 className="h1">Publish</h1>
        <Done outcome={outcome} />
        {nodes && <NodeList nodes={nodes} number={outcome.published.number} />}
      </Page>
    );
  }

  const nothing = review !== null && review.groups.length === 0 && review.problems.length === 0;
  const ready = review !== null && review.canPublish && moved === null;

  return (
    <Page width={review === null || nothing ? undefined : ready ? 'publish' : 'changes'}>
      <h1 className="h1">Publish</h1>
      <Failed outcome={outcome} />
      {review && nothing && <Nothing review={review} />}
      {review && !nothing && (
        <div className="cols">
          <div className="col-main publish-main">
            {moved && <MovedNotice moved={moved} />}
            {review.problems.length > 0 && <Problems problems={review.problems} />}
            {ready && <Callout kind="success" title="Ready to publish" />}
            {review.warnings.length > 0 && <Warnings warnings={review.warnings} />}
            {review.groups.length > 0 && <ChangeList review={review} onDiscard={discard.one} />}
          </div>
          <PublishPanel review={review} publish={publish} discard={discard} />
        </div>
      )}
    </Page>
  );
}
