import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// Guard against faux (synthesized) italic.
//
// No italic font file is bundled (see app.json `expo-font` plugin — only
// regular/medium/semibold/bold weights of Lexend/Atkinson/Nunito). When a
// `<Text>` requests `fontStyle: 'italic'` without a real italic glyph set,
// Android synthesizes it by shearing the regular glyphs. The sheared final
// glyph overhangs its measured advance width; under the New Architecture
// (Fabric) the text node is fixed to the under-measured width and the
// overflowing tail (the last word) is CLIPPED.
//
// Symptom in production v1.11.1: every check-in hint lost its last word
// ("Eine grobe Einschätzung" instead of "… Einschätzung reicht."). Only the
// hints + history detail notes were affected — they were the only italic text.
//
// Rule: do not use faux italic. If italic is wanted back, bundle a real
// italic .ttf, register it in app.json, and wire it through resolveTextStyle —
// then relax this guard for that family.

const ROOT = join(__dirname, '..');
const SCAN_DIRS = ['lib', 'components', 'app'];
const FAUX_ITALIC = /fontStyle\s*:\s*['"]italic['"]/;

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('faux italic guard', () => {
  it('no source file applies fontStyle: italic (no italic font is bundled → Android/Fabric clips it)', () => {
    const offenders: string[] = [];

    for (const dir of SCAN_DIRS) {
      for (const file of collectSourceFiles(join(ROOT, dir))) {
        const lines = readFileSync(file, 'utf8').split('\n');
        lines.forEach((line, index) => {
          if (FAUX_ITALIC.test(line)) {
            offenders.push(`${file.replace(ROOT, '.')}:${index + 1}`);
          }
        });
      }
    }

    expect(offenders).toEqual([]);
  });
});
