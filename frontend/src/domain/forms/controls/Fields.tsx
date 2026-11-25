import { useState } from 'react';
import { useForm } from '../context';
import { isObject, pointerOf, withField, type Doc } from '../engine/document';
import { applies, requiredIn } from '../engine/presence';
import { CertificateCard } from './CertificateCard';
import { Control } from './Control';
import { Hint } from './Hint';
import type { ControlProps } from './props';

interface FieldsProps extends ControlProps {
  // A certificate: its facts stand in for the PEM until Replace.
  certificate?: boolean;
  // In a row: each field is named after the row too.
  named?: boolean;
}

// A nested object renders every field that applies; an empty optional field is absent.
export function FieldsControl({ node, value, pointer, label, onChange, certificate, named }: FieldsProps) {
  const object: Doc = isObject(value) ? value : {};
  const required = requiredIn(node, object);
  const pem = certificate && typeof object.pem === 'string' ? object.pem : null;
  const { describe } = useForm().capabilities;
  const facts = pem === null ? null : (describe?.(pem) ?? null);
  const [replacing, setReplacing] = useState(false);
  const fields = Object.entries(node.properties ?? {}).filter(([, field]) => applies(field, object));

  return (
    <div className="form-fields">
      {facts && <CertificateCard facts={facts} {...(replacing ? {} : { onReplace: () => setReplacing(true) })} />}
      {fields.map(([name, field]) =>
        name === 'pem' && facts && !replacing ? null : (
          <div key={name} className="field">
            <span className="label">
              {field.title ?? name} <span className="mono faint">{name}</span>
              {required.has(name) && <span className="xs faint"> Required</span>}
            </span>
            <Control
              node={field}
              value={object[name]}
              pointer={pointerOf(pointer, name)}
              label={named ? `${label}, ${field.title ?? name}` : (field.title ?? name)}
              onChange={(next) => onChange(withField(object, name, next, required.has(name)))}
            />
            <Hint node={field} />
          </div>
        ),
      )}
    </div>
  );
}
