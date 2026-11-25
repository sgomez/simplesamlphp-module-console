import { useEffect, useRef, useState } from 'react';
import { postJson } from '../../api/client';
import { API } from '../../api/paths';
import type { EditedEntity, Validation } from '../../api/types';
import { checkedOf, marksOf } from './marks';

const VALIDATE_DELAY = 400;

// Checks the text through the API once typing pauses; current holds the text on screen, for answers that arrive late.
export function useValidation(initial: EditedEntity, text: string, entityId: string) {
  const [checked, setChecked] = useState(() => checkedOf(initial));
  const current = useRef(text);

  useEffect(() => {
    current.current = text;
    if (text === checked.text) {
      return;
    }
    const timer = setTimeout(() => {
      void postJson<Validation>(API.spValidate, { entityid: entityId, php: text }).then((result) => {
        if (result.ok && current.current === text) {
          setChecked({ text, marks: marksOf(result.data) });
        }
      });
    }, VALIDATE_DELAY);

    return () => clearTimeout(timer);
  }, [text, checked.text, entityId]);

  return { checked, setChecked, current };
}
