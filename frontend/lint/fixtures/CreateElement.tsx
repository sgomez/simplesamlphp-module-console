import React, { createElement } from 'react';

export function CreateElement() {
  return [createElement('button', { type: 'button' }), React.createElement('input'), document.createElement('dialog')];
}
