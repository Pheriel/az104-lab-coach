const { badRequest } = require('./errors');

function requiredString(value, field, max = 240) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw badRequest(`${field} is required`);
  }
  if (value.trim().length > max) {
    throw badRequest(`${field} must be ${max} characters or fewer`);
  }
  return value.trim();
}

function optionalString(value, field, max = 5000) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw badRequest(`${field} must be a string`);
  if (value.length > max) throw badRequest(`${field} must be ${max} characters or fewer`);
  return value.trim();
}

function positiveInt(value, field) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }
  return parsed;
}

function enumValue(value, field, allowed) {
  if (!allowed.includes(value)) {
    throw badRequest(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

function stringArray(value, field) {
  if (value === undefined || value === null || value === '') return [];
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw badRequest(`${field} must be a string array`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

module.exports = { requiredString, optionalString, positiveInt, enumValue, stringArray };
