import { toNumber } from './toNumber';

describe('toNumber', () => {
  it.each([undefined, null, '', '   ', true, false])(
    'returns undefined for non-numberable primitive %p',
    (value) => {
      expect(toNumber({ value })).toBeUndefined();
    },
  );

  it.each([
    ['string digits', '42', 42],
    ['string float', '3.14', 3.14],
    ['number value', 10, 10],
  ])('parses %s', (_label, value, expected) => {
    expect(toNumber({ value })).toBe(expected);
  });

  it('returns undefined when Number() is NaN', () => {
    expect(toNumber({ value: 'abc' })).toBeUndefined();
    expect(toNumber({ value: {} })).toBeUndefined();
  });
});
