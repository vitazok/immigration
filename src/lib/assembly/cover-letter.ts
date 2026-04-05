import { MODELS, streamText } from '@/lib/llm/client';
import { buildCoverLetterPrompt } from '@/lib/llm/prompts/cover-letter';
import { getConsulate } from '@/lib/knowledge/queries';
import { prisma } from '@/lib/db/client';
import { uploadFilledForm } from './pdf-filler';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ApplicantProfile } from '@/lib/types/applicant';
import type { TripDetails } from '@/lib/types/trip';

export async function generateCoverLetter(
  applicant: ApplicantProfile,
  trip: TripDetails,
  riskFlags: string[],
  locale: string
): Promise<{ text: string; stream: AsyncIterable<string> }> {
  const consulate = getConsulate(trip.targetConsulateId);

  const stream = streamText({
    model: MODELS.sonnet,
    system: 'You are an expert immigration document writer. Generate only the cover letter text — no preamble, no metadata.',
    messages: [
      {
        role: 'user',
        content: buildCoverLetterPrompt(applicant, trip, consulate, riskFlags, locale),
      },
    ],
    maxTokens: 2048,
  });

  // Collect full text while streaming
  let fullText = '';
  const collectingStream = (async function* () {
    for await (const chunk of stream) {
      const text = chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta'
        ? chunk.delta.text
        : '';
      fullText += text;
      yield text;
    }
  })();

  return {
    text: fullText,
    stream: collectingStream,
  };
}

export async function generateCoverLetterPDF(
  applicantId: string,
  text: string
): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const lineHeight = 16;
  const margin = 60;
  const maxWidth = page.getWidth() - margin * 2;

  // Word-wrap text
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }
    const words = paragraph.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  let y = page.getHeight() - margin;
  let currentPage = page;

  for (const line of lines) {
    if (y < margin + lineHeight) {
      currentPage = pdfDoc.addPage([595, 842]);
      y = currentPage.getHeight() - margin;
    }
    if (line) {
      currentPage.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
    y -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();
  return uploadFilledForm(applicantId, pdfBytes, 'cover-letter.pdf');
}
