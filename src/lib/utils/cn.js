/**
 * cn.js
 *
 * Utility for merging Tailwind CSS classes.
 * Combines clsx and tailwind-merge for optimal class merging.
 */

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind CSS conflict resolution
 *
 * @param {...any} inputs - Class names to merge
 * @returns {string} Merged class names
 *
 * @example
 * cn('px-2 py-1', 'px-4') // Returns 'py-1 px-4' (px-4 overrides px-2)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
