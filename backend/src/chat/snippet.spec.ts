import { buildSnippet, citedSentences, stripMarkdownLine, toSentences } from './snippet';

describe('stripMarkdownLine', () => {
  it.each([
    ['## Heading', 'Heading'],
    ['- **Severity 1 (Critical):** service down', 'Severity 1 (Critical): service down'],
    ['1. Go to `Settings` and click *Save*', 'Go to Settings and click Save'],
    ['See [the guide](https://x.y/z) now', 'See the guide now'],
    ['| Severity 1 | 4 hours | 1 hour |', 'Severity 1 | 4 hours | 1 hour'],
    ['| --- | --- |', ''],
    ['snake_case_name stays', 'snake_case_name stays'],
  ])('%s', (input, expected) => {
    expect(stripMarkdownLine(input)).toBe(expected);
  });
});

describe('toSentences', () => {
  it('re-joins wrapped prose, keeps list items separate and drops headings', () => {
    expect(toSentences('## Title\n- First item\n- Second item\n\nOne. Two words\nhere. 3 more.')).toEqual([
      'First item',
      'Second item',
      'One.',
      'Two words here.',
      '3 more.',
    ]);
  });

  it('does not split inside decimals or abbreviations followed by lowercase', () => {
    expect(toSentences('Uptime is 99.9% monthly. e.g. this stays.')).toEqual(['Uptime is 99.9% monthly. e.g. this stays.']);
  });
});

describe('buildSnippet', () => {
  const sso = [
    'After a successful test, Owners can enable **Enforce SSO**, which disables password login for all users',
    'except the break-glass accounts. Enterprise customers can also enable SCIM 2.0 provisioning to create,',
    'update and deactivate users automatically from the identity provider. SCIM is not available on the',
    'Professional plan.',
    '',
    'Just-in-time (JIT) provisioning is available on both Professional and Enterprise plans. New users created',
    'through JIT receive the Member role by default.',
  ].join('\n');

  it('returns the whole chunk as plain text when it is short', () => {
    expect(buildSnippet('## Refunds\n\nRefunds take **30 days**.', 'refund')).toBe('Refunds take 30 days.');
  });

  it('centres the window on the sentence that matches the cited answer', () => {
    const snippet = buildSnippet(sso, 'SCIM 2.0 provisioning is not available on the Professional plan', 120);
    expect(snippet).toContain('SCIM is not available on the Professional plan.');
    expect(snippet.length).toBeLessThanOrEqual(124);
    expect(snippet).not.toContain('**');
  });

  it('marks omitted text before and after the window with ellipses', () => {
    const snippet = buildSnippet(sso, 'SCIM not available Professional plan', 80);
    expect(snippet.startsWith('… ')).toBe(true);
    expect(snippet.endsWith(' …')).toBe(true);
  });

  it('prefers sentences sharing numbers with the answer', () => {
    const text = 'Credits are logged with a reason code always. CSMs approve up to USD 500 per quarter. Leads approve more credits for accounts.';
    expect(buildSnippet(text, 'credits of up to USD 500', 45)).toContain('USD 500');
  });

  it('extends toward the neighbouring sentence that also supports the answer', () => {
    const text =
      'Annual plans can be refunded within 30 days. After 30 days they are non-refundable. Starter plans renew monthly. Services are never refundable.';
    const focus = 'Annual plans can be refunded within 30 days; after 30 days they are non-refundable.';
    expect(buildSnippet(text, focus, 90)).toBe('Annual plans can be refunded within 30 days. After 30 days they are non-refundable. …');
  });

  it('truncates a single very long sentence at a word boundary', () => {
    const snippet = buildSnippet('word '.repeat(200), 'word', 50);
    expect(snippet.length).toBeLessThanOrEqual(50);
    expect(snippet.endsWith('…')).toBe(true);
  });
});

describe('citedSentences', () => {
  it('returns only the answer sentences carrying the marker', () => {
    const answer = 'SCIM is Enterprise only [sso#5]. Credits up to USD 500 [billing#4].';
    expect(citedSentences(answer, 'billing#4')).toBe('Credits up to USD 500 [billing#4].');
    expect(citedSentences(answer, 'other#1')).toBe(answer);
  });
});
