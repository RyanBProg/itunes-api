import { getDayName } from './getDayName';

describe('getDayName', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-04T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns the current day name when no date is provided', () => {
    expect(getDayName()).toBe('Saturday');
  });

  it('returns the proper day name for a provided ISO date string', () => {
    expect(getDayName('2024-01-01T00:00:00Z')).toBe('Monday');
  });

  it('throws when the date string cannot be parsed', () => {
    expect(() => getDayName('not-a-date')).toThrow(
      'Invalid date string: "not-a-date"',
    );
  });
});
