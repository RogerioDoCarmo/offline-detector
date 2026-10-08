import fc from 'fast-check';
import type { OfflineStrings } from './types';
import { resolveLocale, resolveStrings, STRINGS } from './strings';

const LOCALES = ['en', 'pt-BR', 'es'];
const KEYS = Object.keys(STRINGS.en) as (keyof OfflineStrings)[];

describe('resolveLocale (property)', () => {
  it('never throws and always returns one of the three locales', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.string({ unit: 'binary' }), fc.constant(undefined)),
        (input) => {
          expect(LOCALES).toContain(resolveLocale(input));
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('maps every pt-* and es-* tag, in any case, to its bundled locale', () => {
    const region = fc.stringMatching(/^[A-Za-z0-9]{0,8}$/);
    fc.assert(
      fc.property(region, fc.constantFrom('-', '_'), (r, sep) => {
        expect(resolveLocale(`pt${sep}${r}`)).toBe('pt-BR');
        expect(resolveLocale(`ES${sep}${r}`)).toBe('es');
      }),
    );
  });
});

describe('resolveStrings (property)', () => {
  const overrides = fc.dictionary(
    fc.constantFrom(...KEYS),
    fc.oneof(fc.string(), fc.constant(undefined)),
  );

  it('an override wins, every other key keeps the locale value', () => {
    fc.assert(
      fc.property(fc.constantFrom(...LOCALES), overrides, (locale, ov) => {
        const base = STRINGS[locale as keyof typeof STRINGS];
        const result = resolveStrings(locale, ov as Partial<OfflineStrings>);
        for (const key of KEYS) {
          const override = (ov as Record<string, string | undefined>)[key];
          expect(result[key]).toBe(override === undefined ? base[key] : override);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('always returns every key and never touches the bundled tables', () => {
    const before = JSON.stringify(STRINGS);
    fc.assert(
      fc.property(fc.string(), overrides, (locale, ov) => {
        const result = resolveStrings(locale, ov as Partial<OfflineStrings>);
        expect(Object.keys(result).sort()).toEqual([...KEYS].sort());
      }),
    );
    expect(JSON.stringify(STRINGS)).toBe(before);
  });
});
