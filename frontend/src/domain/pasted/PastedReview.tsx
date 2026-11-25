import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Pre } from '../../design-system/Code';
import { Page } from '../../design-system/Page';
import { FilledEntity } from '../entities';
import { PastedReportGroups } from './Report';
import { SaveTroubleCallout, TitleBlock } from './Saving';
import type { PastedObject, Target } from './types';
import { useSavePasted } from './useSavePasted';

interface PastedReviewProps {
  object: PastedObject;
  target: Target;
  // Where Back goes: the paste area, or the External entity copied.
  back: string;
  // A managed copy of an External entity.
  copy?: boolean;
}

interface BarProps {
  needs: boolean;
  editable: boolean;
  saving: boolean;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
}

function ReviewBar({ needs, editable, saving, onBack, onEdit, onSave }: BarProps) {
  if (needs && editable) {
    return (
      <div className="save-bar">
        <div className="save-state" />
        <Button variant="quiet" onPress={onBack}>
          Back
        </Button>
        <Button variant="primary" onPress={onEdit}>
          Continue in editor
        </Button>
      </div>
    );
  }

  return (
    <div className="save-bar">
      <span className="bar-start">
        <Button variant="quiet" onPress={onBack}>
          Back
        </Button>
      </span>
      {editable && <Button onPress={onEdit}>Edit first</Button>}
      <Button variant="primary" loading={saving} onPress={onSave}>
        Save
      </Button>
    </div>
  );
}

// SPEC 9.6 (AddReview, ReviewNeeds): what was read, before it is saved or opened in the editor.
export function PastedReview({ object, target, back, copy }: PastedReviewProps) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const saving = useSavePasted(target);
  const editable = target.kind === 'entity';
  if (editing && target.kind === 'entity') {
    return <FilledEntity php={object.php} onCreated={saving.done} onCancel={() => setEditing(false)} />;
  }

  return (
    <Page
      width="wide"
      bar={
        <ReviewBar
          needs={object.report.needs.length > 0}
          editable={editable}
          saving={saving.saving}
          onBack={() => void navigate(back)}
          onEdit={() => setEditing(true)}
          onSave={() => void saving.save({ php: object.php })}
        />
      }
    >
      <TitleBlock title={object.name ?? object.id} id={object.name === null ? null : object.id} />
      <SaveTroubleCallout trouble={saving.trouble} />
      {copy && <Callout kind="warning" title="The copy stops following its source" />}
      <div className="rev">
        <PastedReportGroups report={object.report} />
        <section className="rev-php">
          <h2 className="h3">PHP</h2>
          <Pre label="PHP">{object.php}</Pre>
        </section>
      </div>
    </Page>
  );
}
