/**
 * Trading-specific error classes
 * Used throughout the market data router and vendors
 */

class RateLimitError extends Error {
  constructor(vendor, message, retryAfter = 60) {
    super(message);
    this.name = 'RateLimitError';
    this.vendor = vendor;
    this.retryAfter = retryAfter;
  }
}

class NotFoundError extends Error {
  constructor(vendor, symbol, message) {
    super(message);
    this.name = 'NotFoundError';
    this.vendor = vendor;
    this.symbol = symbol;
  }
}

class VendorError extends Error {
  constructor(vendor, message, statusCode = null) {
    super(message);
    this.name = 'VendorError';
    this.vendor = vendor;
    this.statusCode = statusCode;
  }
}

module.exports = {
  RateLimitError,
  NotFoundError,
  VendorError
};
