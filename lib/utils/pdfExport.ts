import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import type { CheckIn } from '../types/checkin';
import { buildPdfHtml } from './pdfTemplate';

function buildFileName(checkIns: CheckIn[]): string {
  if (checkIns.length === 0) return 'Check-in Export';

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
  const { uri } = await Print.printToFileAsync({ html });

  const fileName = buildFileName(checkIns);
  const dir = uri.substring(0, uri.lastIndexOf('/') + 1);
  const namedUri = `${dir}${fileName}.pdf`;
  await FileSystem.moveAsync({ from: uri, to: namedUri });

  await Sharing.shareAsync(namedUri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}
