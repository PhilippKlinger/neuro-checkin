import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';
import { StorageAccessFramework, readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import type { CheckIn } from '../types/checkin';
import { buildPdfHtml } from './pdfTemplate';

export const MAX_EXPORT_COUNT = 30;

export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '_');
}

export function buildFileName(checkIns: CheckIn[]): string {
  if (checkIns.length === 0) return 'Check-in Export';

  const formatDate = (iso: string) => iso.split(' ')[0] ?? iso;
  const formatTime = (iso: string) => (iso.split(' ')[1] ?? '00:00:00').slice(0, 5).replace(':', '-');

  if (checkIns.length === 1) {
    return `Check-in ${formatDate(checkIns[0].createdAt)} ${formatTime(checkIns[0].createdAt)}`;
  }

  const sorted = [...checkIns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const from = formatDate(sorted[0].createdAt);
  const to = formatDate(sorted[sorted.length - 1].createdAt);
  if (from === to) {
    const timeFrom = formatTime(sorted[0].createdAt);
    const timeTo = formatTime(sorted[sorted.length - 1].createdAt);
    return `Check-ins ${from} ${timeFrom} bis ${timeTo}`;
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

interface SaveToDiskOptions {
  savedDirectoryUri?: string | null;
  onDirectoryChosen?: (uri: string) => void;
}

export async function saveCheckInsPdfToDevice(
  checkIns: CheckIn[],
  options: SaveToDiskOptions = {}
): Promise<string> {
  if (checkIns.length > MAX_EXPORT_COUNT) {
    throw new Error(`Maximum ${MAX_EXPORT_COUNT} check-ins per export`);
  }

  const html = buildPdfHtml(checkIns);
  const { uri: tempUri } = await Print.printToFileAsync({ html });
  const fileName = sanitizeFileName(buildFileName(checkIns));

  // Try saved directory first (permission already persisted by Android)
  if (options.savedDirectoryUri) {
    try {
      return await writePdfToDirectory(options.savedDirectoryUri, tempUri, fileName);
    } catch {
      // Permission revoked or directory gone — fall through to picker
    }
  }

  // First-time use or saved URI invalid → show picker
  const directoryUri = await requestNewDirectory(options);
  return await writePdfToDirectory(directoryUri, tempUri, fileName);
}

async function requestNewDirectory(options: SaveToDiskOptions): Promise<string> {
  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    throw new Error('Permission denied');
  }
  options.onDirectoryChosen?.(permissions.directoryUri);
  return permissions.directoryUri;
}

async function writePdfToDirectory(
  directoryUri: string,
  tempUri: string,
  fileName: string
): Promise<string> {
  const fileUri = await StorageAccessFramework.createFileAsync(
    directoryUri,
    fileName,
    'application/pdf'
  );
  const base64Content = await readAsStringAsync(tempUri, { encoding: EncodingType.Base64 });
  await StorageAccessFramework.writeAsStringAsync(fileUri, base64Content, {
    encoding: EncodingType.Base64,
  });
  return fileUri;
}
