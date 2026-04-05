#!/usr/bin/env tsx
// Seeds the knowledge base consulate data into the database (optional).
// For MVP, the knowledge base is loaded directly from JSON files.
// This script validates all consulate JSON files and reports any issues.

import * as fs from 'fs';
import * as path from 'path';
import { loadAllConsulates } from '../src/lib/knowledge/loader';

async function main() {
  console.log('🔍 Scanning consulate data files...\n');

  const consulatesDir = path.join(process.cwd(), 'data', 'consulates');
  if (!fs.existsSync(consulatesDir)) {
    console.error(`❌ Consulates directory not found: ${consulatesDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(consulatesDir).filter((f) => f.endsWith('.json'));
  console.log(`Found ${files.length} consulate file(s):\n`);

  let hasErrors = false;

  for (const file of files) {
    const consulateId = file.replace('.json', '');
    try {
      const consulate = loadAllConsulates().find((c) => c.consulateId === consulateId);
      if (!consulate) throw new Error('Failed to load');

      const requiredDocs = consulate.requiredDocuments.filter((d) => d.required).length;
      const tooltipCount = Object.keys(consulate.tooltips).length;
      const faqCount = consulate.faqs.length;

      const lastVerified = new Date(consulate.lastVerifiedDate);
      const daysSince = Math.floor((Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24));
      const staleWarning = daysSince > 90 ? ` ⚠️  (${daysSince} days old — consider updating)` : '';

      console.log(`✅ ${consulateId}`);
      console.log(`   Country: ${consulate.country}, ${consulate.city}`);
      console.log(`   Required docs: ${requiredDocs}`);
      console.log(`   Tooltips: ${tooltipCount}`);
      console.log(`   FAQs: ${faqCount}`);
      console.log(`   Last verified: ${consulate.lastVerifiedDate}${staleWarning}`);
      console.log(`   Refusal rate: ${(consulate.refusalRateEstimate * 100).toFixed(0)}%`);
      console.log();
    } catch (err) {
      console.error(`❌ ${file}: ${err instanceof Error ? err.message : String(err)}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\n❌ Some consulate files have errors. Fix them before deploying.');
    process.exit(1);
  }

  console.log('✅ All consulate data files are valid.\n');
  console.log('ℹ️  The knowledge base is loaded from JSON files at runtime — no database seeding required.');
  console.log('ℹ️  To add a new consulate, create data/consulates/{CONSULATE_ID}.json and re-run this script.');
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
