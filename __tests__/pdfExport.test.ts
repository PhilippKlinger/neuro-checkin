import type { CheckIn } from '../lib/types/checkin';
import { EMPTY_BODY_SIGNALS } from '../lib/types/checkin';

// ---------------------------------------------------------------------------
// Mock expo-print and expo-sharing
// ---------------------------------------------------------------------------

const mockPrintToFileAsync = jest.fn();
const mockShareAsync = jest.fn();
const mockMoveAsync = jest.fn();

jest.mock('expo-print', () => ({
  printToFileAsync: (...args: unknown[]) => mockPrintToFileAsync(...args),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

jest.mock('expo-file-system', () => ({
  moveAsync: (...args: unknown[]) => mockMoveAsync(...args),
}));

// Import AFTER mocks are registered
import { exportCheckInsAsPdf } from '../lib/utils/pdfExport';

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

// ---------------------------------------------------------------------------
// exportCheckInsAsPdf
// ---------------------------------------------------------------------------

describe('exportCheckInsAsPdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrintToFileAsync.mockResolvedValue({ uri: 'file:///tmp/export.pdf' });
    mockShareAsync.mockResolvedValue(undefined);
    mockMoveAsync.mockResolvedValue(undefined);
  });

  it('calls printToFileAsync with an HTML string', async () => {
    await exportCheckInsAsPdf([SAMPLE]);
    expect(mockPrintToFileAsync).toHaveBeenCalledTimes(1);
    const arg = mockPrintToFileAsync.mock.calls[0][0];
    expect(typeof arg.html).toBe('string');
    expect(arg.html).toContain('<!DOCTYPE html>');
  });

  it('renames file and calls shareAsync with descriptive filename', async () => {
    await exportCheckInsAsPdf([SAMPLE]);
    expect(mockMoveAsync).toHaveBeenCalledWith({
      from: 'file:///tmp/export.pdf',
      to: 'file:///tmp/Check-in 2026-05-19.pdf',
    });
    expect(mockShareAsync).toHaveBeenCalledWith(
      'file:///tmp/Check-in 2026-05-19.pdf',
      expect.objectContaining({ mimeType: 'application/pdf' })
    );
  });

  it('throws when printToFileAsync fails', async () => {
    mockPrintToFileAsync.mockRejectedValue(new Error('print failed'));
    await expect(exportCheckInsAsPdf([SAMPLE])).rejects.toThrow();
  });

  it('does not call shareAsync when printToFileAsync fails', async () => {
    mockPrintToFileAsync.mockRejectedValue(new Error('print failed'));
    await expect(exportCheckInsAsPdf([SAMPLE])).rejects.toThrow();
    expect(mockShareAsync).not.toHaveBeenCalled();
  });
});
