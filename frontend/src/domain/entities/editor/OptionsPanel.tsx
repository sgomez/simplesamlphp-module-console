import { useState } from 'react';
import { Button } from '../../../design-system/Button';
import { Card } from '../../../design-system/Card';
import { Input } from '../../../design-system/Input';
import { Row } from '../../../design-system/Row';
import { options, type SchemaOption } from '../../documents';
import { optionLines, phpLiteral } from './phpText';

interface OptionsPanelProps {
  text: string;
  onInsert: (option: SchemaOption) => void;
}

const SP_OPTIONS = options['saml20-sp-remote'];

function matches(option: SchemaOption, query: string): boolean {
  const needle = query.trim().toLowerCase();

  return option.name.toLowerCase().includes(needle) || option.title.toLowerCase().includes(needle);
}

// SPEC 10.11: the options of the schema, a set one with its line, one not set with Insert.
export function OptionsPanel({ text, onInsert }: OptionsPanelProps) {
  const [query, setQuery] = useState('');
  const lines = optionLines(text);
  const shown = SP_OPTIONS.filter((option) => matches(option, query));

  return (
    <div className="options">
      <h2 className="h3">Options</h2>
      <Input type="search" placeholder="Search" label="Search options" value={query} onChange={setQuery} />
      {shown.length > 0 && (
        <Card className="options-list">
          {shown.map((option) => {
            const line = lines.get(option.name);

            return (
              <Row key={option.name} plain className="option-row">
                <div className="option-main">
                  <span className="mono wrap-any">{option.name}</span>
                  <span className="xs muted">{option.title}</span>
                  {option.default !== undefined && (
                    <span className="xs muted">
                      {`${option.type} · default `}
                      <span className="mono">{phpLiteral(option.default)}</span>
                    </span>
                  )}
                </div>
                {line === undefined ? (
                  <Button variant="quiet" small label={`Insert ${option.name}`} onPress={() => onInsert(option)}>
                    Insert
                  </Button>
                ) : (
                  <span className="xs faint option-at">{`Line ${line}`}</span>
                )}
              </Row>
            );
          })}
        </Card>
      )}
    </div>
  );
}
