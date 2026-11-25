import { Button } from '../../../design-system/Button';
import { Card } from '../../../design-system/Card';
import { Facts } from '../../../design-system/Facts';
import { WarningIcon } from '../../../design-system/icons';
import { onDay } from '../../../lib/time';
import { useForm, type CertificateFacts } from '../context';

const DEFAULT_WARNING_DAYS = 30;

function left(days: number): string {
  if (days < 0) {
    return 'expired';
  }

  return days === 1 ? 'in 1 day' : `in ${days} days`;
}

function flagOf(days: number, within: number): string | null {
  if (days < 0) {
    return 'Expired.';
  }

  return days <= within ? `Expires ${left(days)}.` : null;
}

// SPEC 7.6: subject and expiry of a valid pasted certificate, flagged near or past expiry.
export function CertificateCard({ facts, onReplace }: { facts: CertificateFacts; onReplace?: () => void }) {
  const within = useForm().capabilities.expiryWarningDays ?? DEFAULT_WARNING_DAYS;
  const flag = flagOf(facts.days, within);

  return (
    <>
      <Card className="cert">
        <Facts
          facts={[
            { term: 'Subject', value: facts.subject, className: 'mono wrap-any' },
            { term: 'Expires', value: `${onDay(facts.expires)}, ${left(facts.days)}` },
          ]}
        />
        {onReplace && (
          <Button small onPress={onReplace}>
            Replace
          </Button>
        )}
      </Card>
      {flag && (
        <div className="msg-warning">
          <WarningIcon />
          <span>{flag}</span>
        </div>
      )}
    </>
  );
}
