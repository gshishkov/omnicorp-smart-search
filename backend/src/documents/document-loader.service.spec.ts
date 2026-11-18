import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DocumentLoaderService, parseFrontMatter, resolveTitle, toSourceId } from './document-loader.service';

describe('document loader helpers', () => {
  it('derives a slug source id from the file name', () => {
    expect(toSourceId('SLA & Support Tiers.md')).toBe('sla-support-tiers');
  });

  it('parses simple front-matter and strips it from the body', () => {
    const { data, body } = parseFrontMatter('---\ntitle: "Billing"\nowner: Finance\n---\n# Heading\nText');
    expect(data).toEqual({ title: 'Billing', owner: 'Finance' });
    expect(body).toBe('# Heading\nText');
  });

  it('resolves the title from front-matter, then H1, then file name', () => {
    expect(resolveTitle('FM Title', '# H1', 'a.md')).toBe('FM Title');
    expect(resolveTitle(undefined, 'intro\n# H1 Title\n', 'a.md')).toBe('H1 Title');
    expect(resolveTitle(undefined, 'no heading', 'my-file.md')).toBe('my-file');
  });
});

describe('DocumentLoaderService', () => {
  let dir: string;
  const loader = new DocumentLoaderService();

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kb-'));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('loads only non-empty markdown files, sorted by name', async () => {
    await fs.writeFile(path.join(dir, 'b.md'), '# Bravo\ntext');
    await fs.writeFile(path.join(dir, 'a.md'), '---\ntitle: Alpha\n---\nbody');
    await fs.writeFile(path.join(dir, 'empty.md'), '---\ntitle: Empty\n---\n   ');
    await fs.writeFile(path.join(dir, 'ignore.txt'), 'nope');

    const { documents, errors } = await loader.loadAll(dir);
    expect(documents.map((d) => [d.sourceId, d.title])).toEqual([
      ['a', 'Alpha'],
      ['b', 'Bravo'],
    ]);
    expect(errors).toEqual(['empty.md: skipped, document is empty']);
  });

  it('reports a missing folder as an error instead of throwing', async () => {
    const { documents, errors } = await loader.loadAll(path.join(dir, 'missing'));
    expect(documents).toEqual([]);
    expect(errors[0]).toMatch(/Source folder not found/);
  });
});
