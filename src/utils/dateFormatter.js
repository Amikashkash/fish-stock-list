/**
 * Date formatting utilities
 */

/**
 * Format a date or Firestore Timestamp to DD/MM/YYYY format
 * @param {Date|Object} date - JavaScript Date or Firestore Timestamp object
 * @returns {string} Formatted date string (DD/MM/YYYY)
 */
export function formatDateDDMMYYYY(date) {
  if (!date) return ''

  let jsDate
  if (date.seconds) {
    // Firestore Timestamp
    jsDate = new Date(date.seconds * 1000)
  } else if (date instanceof Date) {
    jsDate = date
  } else if (typeof date === 'string') {
    jsDate = new Date(date)
  } else {
    return ''
  }

  if (isNaN(jsDate.getTime())) {
    return ''
  }

  const day = String(jsDate.getDate()).padStart(2, '0')
  const month = String(jsDate.getMonth() + 1).padStart(2, '0')
  const year = jsDate.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Format date for display with Hebrew locale
 * @param {Date|Object} date - JavaScript Date or Firestore Timestamp object
 * @returns {string} Formatted date string
 */
export function formatDateHebrewLong(date) {
  if (!date) return ''

  let jsDate
  if (date.seconds) {
    jsDate = new Date(date.seconds * 1000)
  } else if (date instanceof Date) {
    jsDate = date
  } else if (typeof date === 'string') {
    jsDate = new Date(date)
  } else {
    return ''
  }

  if (isNaN(jsDate.getTime())) {
    return ''
  }

  return jsDate.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
