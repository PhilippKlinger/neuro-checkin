import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, StorageAccessFramework, readAsStringAsync, EncodingType } from 'expo-file-system';
import type { CheckIn } from '../types/checkin';
import { buildPdfHtml } from './pdfTemplate';

export const MAX_EXPORT_COUNT = 30;

export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '_');
}

export function buildFileName(checkIns: CheckIn[]): string {
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
  if (checkIns.length > MAX_EXPORT_COUNT) {
    throw new Error(`Maximum ${MAX_EXPORT_COUNT} check-ins per export`);
  }

  const html = buildPdfHtml(checkIns);
  const { uri } = await Print.printToFileAsync({ html });

  const fileName = sanitizeFileName(buildFileName(checkIns));
  const file = new File(uri);

  // Prevent FileAlreadyExistsException if same filename was exported earlier today
  const dir = uri.substring(0, uri.lastIndexOf('/') + 1);
  const target = new File(`${dir}${fileName}.pdf`);
  if (target.exists) {
    target.delete();
  }

  file.rename(`${fileName}.pdf`);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}

export async function saveCheckInsPdfToDevice(checkIns: CheckIn[]): Promise<string> {
  if (checkIns.length > MAX_EXPORT_COUNT) {
    throw new Error(`Maximum ${MAX_EXPORT_COUNT} check-ins per export`);
  }

  // Request directory permission via SAF
  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    throw new Error('Permission denied');
  }

  const html = buildPdfHtml(checkIns);
  const { uri: tempUri } = await Print.printToFileAsync({ html });

  const fileName = sanitizeFileName(buildFileName(checkIns));

  // Create file in selected directory
  const fileUri = await StorageAccessFramework.createFileAsync(
    permissions.directoryUri,
    fileName,
    'application/pdf'
  );

  // Read temp PDF as base64 and write to SAF location
  const base64Content = await readAsStringAsync(tempUri, { encoding: EncodingType.Base64 });
  await StorageAccessFramework.writeAsStringAsync(fileUri, base64Content, {
    encoding: EncodingType.Base64,
  });

  return fileUri;
}
