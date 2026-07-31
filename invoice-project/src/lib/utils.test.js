import { getNextInvoiceNumber, formatInvoiceNumber } from './utils';

const YEAR = new Date().getFullYear();

test('returns counter 1 when nothing stored', () => {
  expect(getNextInvoiceNumber(null)).toEqual({ year: YEAR, counter: 1 });
});

test('increments counter when same year', () => {
  expect(getNextInvoiceNumber({ year: YEAR, counter: 5 })).toEqual({ year: YEAR, counter: 6 });
});

test('resets counter to 1 when year changes', () => {
  expect(getNextInvoiceNumber({ year: 2020, counter: 99 })).toEqual({ year: YEAR, counter: 1 });
});

test('formats number as YYYY-NNNN', () => {
  expect(formatInvoiceNumber({ year: 2026, counter: 3 })).toBe('2026-0003');
  expect(formatInvoiceNumber({ year: 2026, counter: 100 })).toBe('2026-0100');
});
