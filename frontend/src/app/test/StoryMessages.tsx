import { Fragment, useCallback, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Callout } from '../../design-system/Callout';
import { PageNotice } from '../../design-system/Page';
import { ReportMessage } from '../../domain/session';

// The Console's one-shot message in a story: shown on the page it moves to, which loads afresh.
export function StoryMessages({ children }: { children: ReactNode }) {
  const [said, setSaid] = useState<{ text: string; round: number } | null>(null);
  const navigate = useNavigate();
  const announce = useCallback(
    (text: string, to?: string) => {
      setSaid((last) => ({ text, round: (last?.round ?? 0) + 1 }));
      if (to !== undefined) {
        void navigate(to, { replace: true });
      }
    },
    [navigate],
  );

  return (
    <ReportMessage value={announce}>
      <PageNotice value={said && <Callout kind="success" title={said.text} />}>
        <Fragment key={said?.round ?? 0}>{children}</Fragment>
      </PageNotice>
    </ReportMessage>
  );
}
