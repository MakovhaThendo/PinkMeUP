/**
 * Auth utilities - shared functions for authentication
 */

const API_URL = 'https://pinkmeup-api.onrender.com/api/v1';

/**
 * Get current user from localStorage
 */
const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/**
 * Get token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Check if user is authenticated
 */
const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Save auth data to localStorage
 */
const setAuthData = (user, token) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};

/**
 * Clear auth data (logout)
 */
const clearAuthData = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = '/login.html';
};

/**
 * Redirect if not authenticated
 */
const requireAuth = () => {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
};

/**
 * Redirect if already authenticated
 */
const requireGuest = () => {
  if (isAuthenticated()) {
    window.location.href = '/dashboard.html';
    return false;
  }
  return true;
};

/**
 * API request helper with auth header
 */
const authFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  return response;
};

export {
  API_URL,
  getCurrentUser,
  getToken,
  isAuthenticated,
  setAuthData,
  clearAuthData,
  requireAuth,
  requireGuest,
  authFetch
};