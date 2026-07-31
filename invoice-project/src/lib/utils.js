import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getNextInvoiceNumber(stored) {
  const currentYear = new Date().getFullYear();
  if (!stored || stored.year !== currentYear) {
    return { year: currentYear, counter: 1 };
  }
  return { year: stored.year, counter: stored.counter + 1 };
}

export function formatInvoiceNumber({ year, counter }) {
  return `${year}-${String(counter).padStart(4, '0')}`;
}