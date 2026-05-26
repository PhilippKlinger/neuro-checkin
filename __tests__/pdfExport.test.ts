import type { CheckIn } from '../lib/types/checkin';
import { EMPTY_BODY_SIGNALS } from '../lib/types/checkin';

// ---------------------------------------------------------------------------
// Mocks — expo-print and expo-sharing (stable external APIs, not the SUT)
// expo-file-system: minimal File class mock (native runtime unavailable in Jest)
// ---------------------------------------------------------------------------

const mockPrintToFileAsync = jest.fn();
const mockShareAsync = jest.fn();
const mockRename = jest.fn();
const mockDelete = jest.fn();
const mockExists = jest.fn<boolean, [string]>().mockReturnValue(false);

jest.mock('expo-print', () => ({
  printToFileAsync: (...args: unknown[]) => mockPrintToFileAsync(...args),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({
    uri,
    get exists() {
      return mockExists(uri);
    },
    delete() {
      mockDelete(uri);
    },
    rename(newName: string) {
      mockRename(newName);
      // rename mutates uri in real impl
      this.uri = uri.substring(0, uri.lastIndexOf('/') + 1) + newName;
    },
  })),
}));

// Import AFTER mocks are registered
import {
  exportCheckInsAsPdf,
  buildFileName,
  MAX_EXPORT_COUNT,
  sanitizeFileName,
} from '../lib/utils/pdfExport';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const SAMPLE: CheckIn = {
  id: 1,
  createdAt: '2026-05-19 10:00:00',
  energyLevel: 3,
  focusLevel: 4,
  energySkipped: false,
  focusSkipped: false,
  bodySignals: { ...EMPTY_BODY_SIGNALS },
  feelings: 'ruhig',
  feelingsSkipped: false,
  distressLevel: null,
  distressNote: null,
  thoughtsType: null,
  thoughtsNote: null,
  selfCareNote: null,
  innerPart: null,
  note: null,
};

const SAMPLE_2: CheckIn = {
  ...SAMPLE,
  id: 2,
  createdAt: '2026-05-21 14:30:00',
};

// ---------------------------------------------------------------------------
// buildFileName (pure logic — no mocks needed)
// ---------------------------------------------------------------------------

describe('buildFileName', () => {
  it('returns fallback for empty array', () => {
    expect(buildFileName([])).toBe('Check-in Export');
  });

  it('returns single date for one check-in', () => {
    expect(buildFileName([SAMPLE])).toBe('Check-in 2026-05-19');
  });

  it('returns date range for multiple check-ins', () => {
    expect(buildFileName([SAMPLE_2, SAMPLE])).toBe('Check-ins 2026-05-19 bis 2026-05-21');
  });

  it('returns single date when all check-ins are same day', () => {
    const sameDay = { ...SAMPLE, id: 3, createdAt: '2026-05-19 18:00:00' };
    expect(buildFileName([SAMPLE, sameDay])).toBe('Check-ins 2026-05-19');
  });

  it('handles dates with special characters gracefully', () => {
    const result = buildFileName([SAMPLE]);
    expect(result).not.toContain('/');
    expect(result).not.toContain('\\');
  });
});

// ---------------------------------------------------------------------------
// MAX_EXPORT_COUNT constant
// ---------------------------------------------------------------------------

describe('MAX_EXPORT_COUNT', () => {
  it('is 30', () => {
    expect(MAX_EXPORT_COUNT).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// sanitizeFileName (S-01: prevent directory traversal)
// ---------------------------------------------------------------------------

describe('sanitizeFileName', () => {
  it('returns name unchanged when no special characters', () => {
    expect(sanitizeFileName('Check-in 2026-05-19')).toBe('Check-in 2026-05-19');
  });

  it('replaces forward slashes', () => {
    expect(sanitizeFileName('a/b/c')).toBe('a_b_c');
  });

  it('replaces backslashes', () => {
    expect(sanitizeFileName('a\\b\\c')).toBe('a_b_c');
  });

  it('replaces colons', () => {
    expect(sanitizeFileName('10:30:00')).toBe('10_30_00');
  });

  it('replaces all dangerous characters', () => {
    expect(sanitizeFileName('a*b?c"d<e>f|g')).toBe('a_b_c_d_e_f_g');
  });

  it('handles empty string', () => {
    expect(sanitizeFileName('')).toBe('');
  });

  it('handles string with only special characters', () => {
    expect(sanitizeFileName('/*?\\')).toBe('____');
  });
});

// ---------------------------------------------------------------------------
// exportCheckInsAsPdf (orchestration test)
// ---------------------------------------------------------------------------

describe('exportCheckInsAsPdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrintToFileAsync.mockResolvedValue({ uri: 'file:///tmp/export.pdf' });
    mockShareAsync.mockResolvedValue(undefined);
    mockExists.mockReturnValue(false);
  });

  it('generates HTML and calls printToFileAsync', async () => {
    await exportCheckInsAsPdf([SAMPLE]);
    expect(mockPrintToFileAsync).toHaveBeenCalledTimes(1);
    const arg = mockPrintToFileAsync.mock.calls[0][0];
    expect(typeof arg.html).toBe('string');
    expect(arg.html).toContain('<!DOCTYPE html>');
  });

  it('renames file via File.rename with descriptive filename', async () => {
    await exportCheckInsAsPdf([SAMPLE]);
    expect(mockRename).toHaveBeenCalledWith('Check-in 2026-05-19.pdf');
  });

  it('shares renamed file with correct mime type', async () => {
    await exportCheckInsAsPdf([SAMPLE]);
    expect(mockShareAsync).toHaveBeenCalledWith(
      'file:///tmp/Check-in 2026-05-19.pdf',
      expect.objectContaining({ mimeType: 'application/pdf' })
    );
  });

  it('throws when printToFileAsync fails', async () => {
    mockPrintToFileAsync.mockRejectedValue(new Error('print failed'));
    await expect(exportCheckInsAsPdf([SAMPLE])).rejects.toThrow('print failed');
  });

  it('does not call shareAsync when printToFileAsync fails', async () => {
    mockPrintToFileAsync.mockRejectedValue(new Error('print failed'));
    await expect(exportCheckInsAsPdf([SAMPLE])).rejects.toThrow();
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it('handles multiple check-ins with date range filename', async () => {
    await exportCheckInsAsPdf([SAMPLE, SAMPLE_2]);
    expect(mockRename).toHaveBeenCalledWith('Check-ins 2026-05-19 bis 2026-05-21.pdf');
  });

  // H2-01 regression: same-day duplicate export must not crash with FileAlreadyExistsException
  it('deletes existing target file before rename on same-day duplicate export', async () => {
    mockExists.mockImplementation((uri: string) => uri.endsWith('Check-in 2026-05-19.pdf'));

    await exportCheckInsAsPdf([SAMPLE]);

    expect(mockDelete).toHaveBeenCalledWith('file:///tmp/Check-in 2026-05-19.pdf');
    expect(mockRename).toHaveBeenCalledWith('Check-in 2026-05-19.pdf');
    expect(mockShareAsync).toHaveBeenCalled();
  });

  it('skips delete when target file does not already exist', async () => {
    await exportCheckInsAsPdf([SAMPLE]);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('throws when more than MAX_EXPORT_COUNT check-ins are passed', async () => {
    const tooMany = Array.from({ length: MAX_EXPORT_COUNT + 1 }, (_, i) => ({
      ...SAMPLE,
      id: i + 1,
    }));
    await expect(exportCheckInsAsPdf(tooMany)).rejects.toThrow(/maximum/i);
    expect(mockPrintToFileAsync).not.toHaveBeenCalled();
  });

  it('accepts exactly MAX_EXPORT_COUNT check-ins', async () => {
    const exactly = Array.from({ length: MAX_EXPORT_COUNT }, (_, i) => ({
      ...SAMPLE,
      id: i + 1,
    }));
    await exportCheckInsAsPdf(exactly);
    expect(mockPrintToFileAsync).toHaveBeenCalledTimes(1);
  });
});
