import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { SourceDocument } from './documents.types';

export interface LoadResult {
  documents: SourceDocument[];
  errors: string[];
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const MAX_FILE_BYTES = 1024 * 1024;

export function toSourceId(fileName: string): string {
  return path
    .basename(fileName, path.extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Minimal `key: value` front-matter parser (no nested YAML needed for KB articles). */
export function parseFrontMatter(raw: string): { data: Record<string, string>; body: string } {
  const match = FRONT_MATTER.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line.trim());
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { data, body: raw.slice(match[0].length) };
}

export function resolveTitle(frontMatterTitle: string | undefined, body: string, fileName: string): string {
  if (frontMatterTitle) return frontMatterTitle;
  const heading = /^#\s+(.+)$/m.exec(body);
  if (heading) return heading[1].trim();
  return path.basename(fileName, path.extname(fileName));
}

@Injectable()
export class DocumentLoaderService {
  async loadAll(dir: string): Promise<LoadResult> {
    const absDir = path.resolve(dir);
    let entries: string[];
    try {
      entries = await fs.readdir(absDir);
    } catch {
      return { documents: [], errors: [`Source folder not found or not readable: ${dir}`] };
    }

    const documents: SourceDocument[] = [];
    const errors: string[] = [];
    const seen = new Set<string>();

    for (const fileName of entries.filter((f) => f.toLowerCase().endsWith('.md')).sort()) {
      const filePath = path.join(absDir, fileName);
      try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) continue;
        if (stat.size > MAX_FILE_BYTES) {
          errors.push(`${fileName}: skipped, larger than 1 MB`);
          continue;
        }
        const raw = await fs.readFile(filePath, 'utf8');
        const { data, body } = parseFrontMatter(raw);
        if (!body.trim()) {
          errors.push(`${fileName}: skipped, document is empty`);
          continue;
        }
        const sourceId = toSourceId(fileName);
        if (!sourceId || seen.has(sourceId)) {
          errors.push(`${fileName}: skipped, duplicate or invalid source id "${sourceId}"`);
          continue;
        }
        seen.add(sourceId);
        documents.push({
          sourceId,
          title: resolveTitle(data.title, body, fileName),
          fileName,
          content: body,
          sizeBytes: stat.size,
        });
      } catch (err) {
        errors.push(`${fileName}: ${(err as Error).message}`);
      }
    }
    return { documents, errors };
  }
}
