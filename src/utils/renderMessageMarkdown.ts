/**
 * renderMessageMarkdown — mini Markdown renderer pro notifikace
 *
 * Bez externích závislostí. Podporuje:
 *   **tučný text**   → <strong>
 *   *kurzíva*        → <em>
 *   \n (Enter)       → odstavec / <br>
 *
 * @package DechBar_App
 * @subpackage Utils
 */

import type { ReactNode } from 'react';
import { createElement, Fragment } from 'react';

export function renderMessageMarkdown(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const paragraphs = text.split(/\n+/);

  paragraphs.forEach((para, pIdx) => {
    if (pIdx > 0) nodes.push(createElement('br', { key: `br-${pIdx}` }));

    const parts = para.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    parts.forEach((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        nodes.push(createElement('strong', { key: `${pIdx}-${i}` }, part.slice(2, -2)));
      } else if (part.startsWith('*') && part.endsWith('*')) {
        nodes.push(createElement('em', { key: `${pIdx}-${i}` }, part.slice(1, -1)));
      } else {
        nodes.push(part);
      }
    });
  });

  return createElement(Fragment, null, ...nodes);
}
