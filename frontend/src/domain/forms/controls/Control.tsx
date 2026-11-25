import { controlOf } from '../engine/controls';
import { FieldsControl } from './Fields';
import { JsonControl } from './Json';
import { MapRowsControl } from './MapRows';
import type { ControlProps } from './props';
import { RowsControl } from './Rows';
import { AuthsourceControl, ChoiceControl, NumberControl, SwitchControl, TextControl } from './Scalars';
import { SecretControl } from './Secret';

export function Control(props: ControlProps) {
  switch (controlOf(props.node)) {
    case 'select':
    case 'radio':
      return <ChoiceControl {...props} />;
    case 'switch':
      return <SwitchControl {...props} />;
    case 'number':
      return <NumberControl {...props} />;
    case 'secret':
      return <SecretControl {...props} />;
    case 'authsource':
      return <AuthsourceControl {...props} />;
    case 'fields':
      return <FieldsControl {...props} />;
    case 'certificate':
      return <FieldsControl {...props} certificate />;
    case 'rows':
    case 'certificates':
      return <RowsControl {...props} />;
    case 'map':
      return <MapRowsControl {...props} />;
    case 'json':
      return <JsonControl {...props} />;
    default:
      return <TextControl {...props} />;
  }
}
