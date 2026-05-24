import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge for conditional styling.
 * This utility merges Tailwind CSS classes efficiently, handling conflicts and duplicates.
 *
 * @param inputs - Variable number of class values (strings, objects, arrays)
 * @returns Merged and deduplicated class string
 *
 * @example
 * ```ts
 * cn('bg-red-500', 'text-white', { 'font-bold': true })
 * // Returns: 'bg-red-500 text-white font-bold'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
