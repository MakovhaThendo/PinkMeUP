/**
 * Helper functions for date/time operations and validation
 */

const moment = require('moment');

const parseTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTimeString = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const generateTimeSlots = (startStr, endStr, intervalMinutes = 30) => {
  const start = parseTimeToMinutes(startStr);
  const end = parseTimeToMinutes(endStr);
  const slots = [];
  for (let current = start; current < end; current += intervalMinutes) {
    slots.push(minutesToTimeString(current));
  }
  return slots;
};

const isValidTimeFormat = (timeStr) => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr);
};

const getDayOfWeek = (date) => {
  if (!date) return null;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(date).getDay()];
};

const calculateEndTime = (startTime, durationMinutes) => {
  return minutesToTimeString(parseTimeToMinutes(startTime) + durationMinutes);
};

const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return null;
  return moment(date).format(format);
};

const formatTime = (time, format = 'HH:mm') => {
  if (!time) return null;
  return moment(time, 'HH:mm').format(format);
};

const isTimeWithinRange = (timeStr, startStr, endStr) => {
  const time = parseTimeToMinutes(timeStr);
  return time >= parseTimeToMinutes(startStr) && time <= parseTimeToMinutes(endStr);
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