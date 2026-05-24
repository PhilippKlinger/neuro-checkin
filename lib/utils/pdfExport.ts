import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { CheckIn } from '../types/checkin';
import { buildPdfHtml } from './pdfTemplate';

function buildFileName(checkIns: CheckIn[]): string {
  const formatDate = (iso: string) => iso.split(' ')[0] ?? iso;

  if (checkIns.length === 1) {
    return `Check-in ${formatDate(checkIns[0].createdAt)}`;
  }

  const sorted = [...checkIns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const from = formatDate(sorted[0].createdAt);
  const to = formatDate(sorted[sorted.length - 1].createdAt);
  if (from === to) {
    return `Check-ins ${from}`;
  }
  return `Check-ins ${from} bis ${to}`;
}

export async function exportCheckInsAsPdf(checkIns: CheckIn[]): Promise<void> {
  const html = buildPdfHtml(checkIns);
  const fileName = buildFileName(checkIns);
  const { uri } = await Print.printToFileAsync({ html, fileName });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}
