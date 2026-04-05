import * as fs from 'fs';
import * as path from 'path';
import type { ConsulateRequirement } from '@/lib/types/consulate';

// Knowledge base is loaded once at server start and cached in memory.
// Adding a new consulate = adding a new JSON file in data/consulates/.
const cache = new Map<string, ConsulateRequirement>();

function getConsulatesDir(): string {
  return path.join(process.cwd(), 'data', 'consulates');
}

export function loadConsulate(consulateId: string): ConsulateRequirement {
  if (cache.has(consulateId)) {
    return cache.get(consulateId) as ConsulateRequirement;
  }

  const filePath = path.join(getConsulatesDir(), `${consulateId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Consulate not found: ${consulateId}. Expected file: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw) as ConsulateRequirement;
  cache.set(consulateId, data);
  return data;
}

export function loadAllConsulates(): ConsulateRequirement[] {
  const dir = getConsulatesDir();
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  return files.map((f) => loadConsulate(f.replace('.json', '')));
}

export function isDataStale(consulate: ConsulateRequirement): boolean {
  const lastVerified = new Date(consulate.lastVerifiedDate);
  const now = new Date();
  const daysDiff = (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff > 90;
}

// Clear cache (used in tests)
export function clearCache(): void {
  cache.clear();
}
