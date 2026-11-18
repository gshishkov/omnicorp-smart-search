import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnswerText } from './AnswerText';

const citations = [
  { sourceId: 'a', documentTitle: 'Doc A', chunkId: 'a#0', textSnippet: '' },
  { sourceId: 'b', documentTitle: 'Doc B', chunkId: 'b#2', textSnippet: '' },
];

describe('AnswerText', () => {
  it('replaces chunk markers with citation numbers and drops unknown markers', () => {
    const { container } = render(
      <AnswerText messageId="m1" citations={citations} text="One [a#0]. Two [b#2]. Three [zzz#9]." />,
    );
    expect(screen.getByRole('link', { name: '[1]' })).toHaveAttribute('href', '#cite-m1-1');
    expect(screen.getByRole('link', { name: '[2]' })).toHaveAttribute('title', 'Doc B');
    expect(container.textContent).toBe('One [1]. Two [2]. Three .');
  });
});
