const USER_ROLES = {
  CUSTOMER: 'customer',
  STYLIST: 'stylist',
  ADMIN: 'admin'
};

const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

const BUSINESS_HOURS = {
  START: '08:00',
  END: '18:00',
  DAYS: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

module.exports = {
  USER_ROLES,
  APPOINTMENT_STATUS,
  BUSINESS_HOURS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  HTTP_STATUS
};
