import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Result } from '../../lib/result';
import { useSettle } from '../session';
import { detectFormat, tooLarge } from './detect';
import { useHold } from './hold';
import type { PastedFormat, Reading } from './types';

export interface Paste {
  text: string;
  setText: (text: string) => void;
  format: PastedFormat;
  choose: (format: PastedFormat) => void;
  tooLarge: boolean;
  reading: boolean;
  failed: number | null;
  // What the last Review read, while the text is the one it read; one it cannot move on with.
  shown: Reading | null;
  // The last unreadable answer, kept while the text is corrected.
  problems: Reading | null;
  review: () => Promise<void>;
  // Moves to a step with the text taken along, as "Add as identity provider" does; Back finds the text again.
  carry: (at: string, reading: Reading) => void;
}

interface PasteOptions {
  // The path this paste area is at, where text carried to it is found.
  at: string;
  read: (text: string, format: PastedFormat) => Promise<Result<Reading>>;
  // The step that shows a reading, or null when this one shows it.
  next: (reading: Reading) => string | null;
  formats?: readonly PastedFormat[];
}

export function usePaste({ at, read, next, formats = ['xml', 'php'] }: PasteOptions): Paste {
  const navigate = useNavigate();
  const settle = useSettle();
  const { held, hold } = useHold();
  const [text, setText] = useState(() => held(at)?.text ?? '');
  const [chosen, setChosen] = useState<{ text: string; format: PastedFormat } | null>(null);
  const [answer, setAnswer] = useState<{ text: string; reading: Reading } | null>(null);
  const [reading, setReading] = useState(false);
  const [failed, setFailed] = useState<number | null>(null);
  const detected = detectFormat(text);
  const format = chosen?.text === text ? chosen.format : formats.includes(detected) ? detected : (formats[0] ?? 'php');
  const carry = (to: string, found: Reading) => {
    hold({ at, text, format, reading: found });
    hold({ at: to, text, format, reading: found });
    void navigate(to);
  };

  return {
    text,
    setText,
    format,
    choose: (picked) => setChosen({ text, format: picked }),
    tooLarge: tooLarge(text),
    reading,
    failed,
    shown: answer?.text === text ? answer.reading : null,
    problems: answer?.reading.kind === 'unreadable' ? answer.reading : null,
    carry,
    review: async () => {
      setReading(true);
      setFailed(null);
      const result = await read(text, format);
      setReading(false);
      if (!result.ok) {
        settle(result, setFailed);

        return;
      }
      const to = next(result.data);
      if (to === null) {
        setAnswer({ text, reading: result.data });
      } else {
        carry(to, result.data);
      }
    },
  };
}
