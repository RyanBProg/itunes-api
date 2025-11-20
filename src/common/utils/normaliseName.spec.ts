import { normaliseName } from './normaliseName';

describe('normaliseName', () => {
  it.each([
    ['The Weeknd', 'Weeknd'],
    ['the  Beatles', 'Beatles'],
    ['An Horse', 'Horse'],
    ['a Tribe Called Quest', 'Tribe Called Quest'],
  ])('strips leading article from "%s"', (input, expected) => {
    expect(normaliseName(input)).toBe(expected);
  });

  it('trims surrounding whitespace', () => {
    expect(normaliseName('  Radiohead  ')).toBe('Radiohead');
  });

  it('returns the same string when there is no article', () => {
    expect(normaliseName('Metallica')).toBe('Metallica');
  });
});
