import type { CheckIn } from '../lib/types/checkin';
import { EMPTY_BODY_SIGNALS } from '../lib/types/checkin';

// ---------------------------------------------------------------------------
// Mocks — expo-print and expo-sharing (stable external APIs, not the SUT)
// expo-file-system: minimal File class mock (native runtime unavailable in Jest)
// ---------------------------------------------------------------------------

const mockPrintToFileAsync = jest.fn();
const mockShareAsync = jest.fn();
const mockRename = jest.fn();

jest.mock('expo-print', () => ({
  printToFileAsync: (...args: unknown[]) => mockPrintToFileAsync(...args),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({
    uri,
    rename(newName: string) {
      mockRename(newName);
      // rename mutates uri in real impl
      this.uri = uri.substring(0, uri.lastIndexOf('/') + 1) + newName;
    },
  })),
}));

// Import AFTER mocks are registered
import { exportCheckInsAsPdf, buildFileName } from '../lib/utils/pdfExport';

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
// exportCheckInsAsPdf (orchestration test)
// ---------------------------------------------------------------------------

describe('exportCheckInsAsPdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrintToFileAsync.mockResolvedValue({ uri: 'file:///tmp/export.pdf' });
    mockShareAsync.mockResolvedValue(undefined);
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
});
