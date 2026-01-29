import { formatRelativeTime } from './dateUtils';

describe('formatRelativeTime', () => {
    it('returns empty string for null/undefined', () => {
        expect(formatRelativeTime(null)).toBe('');
        expect(formatRelativeTime(undefined)).toBe('');
    });

    it('returns "Il y a moins d\'une minute" for recent times', () => {
        const now = new Date();
        const recent = new Date(now.getTime() - 1000 * 30); // 30 seconds ago
        expect(formatRelativeTime(recent.toISOString())).toBe('Il y a moins d\'une minute');
    });

    it('returns correct minutes', () => {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 1000 * 60 * 5); // 5 mins
        expect(formatRelativeTime(fiveMinutesAgo.toISOString())).toBe('Il y a 5 minutes');
    });

    it('returns correct hours', () => {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 1000 * 60 * 60 * 2.1); // 2 hours
        expect(formatRelativeTime(twoHoursAgo.toISOString())).toBe('Il y a 2 heures');
    });

    it('returns correct days', () => {
        const now = new Date();
        const fiveDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5.1); // 5 days
        expect(formatRelativeTime(fiveDaysAgo.toISOString())).toBe('Il y a 5 jours');
    });
});
