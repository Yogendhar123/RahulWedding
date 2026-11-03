import { describe, it, expect } from 'vitest';
import { getCountdown } from './countdown';
describe('timezone-aware wedding countdown', () => {
  it('uses the Indian muhurtham time, not the visitor timezone', () => {
    expect(getCountdown('2026-11-22T09:15:00+05:30', Date.parse('2026-11-21T03:45:00Z'))).toEqual({ days: 1, hours: 0, minutes: 0, seconds: 0, complete: false });
  });
  it('never displays negative units', () => {
    expect(getCountdown('2026-11-22T09:15:00+05:30', Date.parse('2026-11-23T00:00:00Z'))).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, complete: true });
  });
});