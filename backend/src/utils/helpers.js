/**
 * helpers.js
 * Utility helper functions for date/time operations
 */

const moment = require('moment');

/**
 * Format date to string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string (default: 'YYYY-MM-DD')
 * @returns {string|null} Formatted date string
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return null;
  return moment(date).format(format);
};

/**
 * Format time to string
 * @param {string} time - Time string (HH:MM)
 * @param {string} format - Format string (default: 'HH:mm')
 * @returns {string|null} Formatted time string
 */
const formatTime = (time, format = 'HH:mm') => {
  if (!time) return null;
  return moment(time, 'HH:mm').format(format);
};

/**
 * Parse time string to minutes
 * @param {string} timeStr - Time string (HH:MM)
 * @returns {number} Total minutes
 */
const parseTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes to time string
 * @param {number} totalMinutes - Total minutes
 * @returns {string} Time string (HH:MM)
 */
const minutesToTimeString = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Check if time is within range
 * @param {string} timeStr - Time to check (HH:MM)
 * @param {string} startStr - Start time (HH:MM)
 * @param {string} endStr - End time (HH:MM)
 * @returns {boolean} True if within range
 */
const isTimeWithinRange = (timeStr, startStr, endStr) => {
  const time = parseTimeToMinutes(timeStr);
  const start = parseTimeToMinutes(startStr);
  const end = parseTimeToMinutes(endStr);
  return time >= start && time <= end;
};

/**
 * Generate time slots between start and end times
 * @param {string} startStr - Start time (HH:MM)
 * @param {string} endStr - End time (HH:MM)
 * @param {number} intervalMinutes - Interval in minutes (default: 30)
 * @returns {string[]} Array of time slots
 */
const generateTimeSlots = (startStr, endStr, intervalMinutes = 30) => {
  const start = parseTimeToMinutes(startStr);
  const end = parseTimeToMinutes(endStr);
  const slots = [];

  for (let current = start; current < end; current += intervalMinutes) {
    slots.push(minutesToTimeString(current));
  }

  return slots;
};

/**
 * Validate time format
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} True if valid format
 */
const isValidTimeFormat = (timeStr) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
};

/**
 * Get day of week from date
 * @param {Date|string} date - Date to check
 * @returns {string|null} Day of week (lowercase)
 */
const getDayOfWeek = (date) => {
  if (!date) return null;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(date).getDay()];
};

/**
 * Calculate end time from start time and duration
 * @param {string} startTime - Start time (HH:MM)
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} End time (HH:MM)
 */
const calculateEndTime = (startTime, durationMinutes) => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTimeString(endMinutes);
};

module.exports = {
  formatDate,
  formatTime,
  parseTimeToMinutes,
  minutesToTimeString,
  isTimeWithinRange,
  generateTimeSlots,
  isValidTimeFormat,
  getDayOfWeek,
  calculateEndTime
};