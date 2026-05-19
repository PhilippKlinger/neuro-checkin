import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { CheckIn } from '../types/checkin';
import { buildPdfHtml } from './pdfTemplate';

export async function exportCheckInsAsPdf(checkIns: CheckIn[]): Promise<void> {
  const html = buildPdfHtml(checkIns);
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}
