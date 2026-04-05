#!/usr/bin/env tsx
// Extracts all AcroForm field names and types from a PDF file.
// Usage: npm run extract-pdf-fields -- --pdf /path/to/form.pdf
//
// Run this whenever you update the PDF form to verify field IDs.
// The field IDs in src/lib/assembly/form-mapper.ts must match exactly.

import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';

async function main() {
  const args = process.argv.slice(2);
  const pdfArgIndex = args.indexOf('--pdf');
  const pdfPath = pdfArgIndex !== -1
    ? args[pdfArgIndex + 1]
    : path.join(process.cwd(), 'public', 'forms', 'schengen-form.pdf');

  if (!pdfPath || !fs.existsSync(pdfPath)) {
    console.error(`❌ PDF file not found: ${pdfPath}`);
    console.error('Usage: npm run extract-pdf-fields -- --pdf /path/to/form.pdf');
    process.exit(1);
  }

  console.log(`📄 Reading PDF: ${pdfPath}\n`);

  const bytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  if (fields.length === 0) {
    console.log('⚠️  No AcroForm fields found in this PDF.');
    console.log('   This may not be a fillable form, or it may use a different form engine.');
    process.exit(0);
  }

  console.log(`Found ${fields.length} AcroForm fields:\n`);
  console.log('Field Name'.padEnd(50) + 'Type');
  console.log('-'.repeat(70));

  for (const field of fields) {
    console.log(field.getName().padEnd(50) + field.constructor.name);
  }

  console.log('\n✅ Copy any new/changed field names to src/lib/assembly/form-mapper.ts');
}

main().catch((err) => {
  console.error('Failed to extract fields:', err);
  process.exit(1);
});
