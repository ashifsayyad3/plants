export const CONSTANTS = {
  API_PREFIX: '/api/v1',

  HTTP_STATUS: {
    OK:                200,
    CREATED:           201,
    NO_CONTENT:        204,
    BAD_REQUEST:       400,
    UNAUTHORIZED:      401,
    FORBIDDEN:         403,
    NOT_FOUND:         404,
    CONFLICT:          409,
    UNPROCESSABLE:     422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_ERROR:    500,
  },

  MESSAGES: {
    SUCCESS:            'Success',
    CREATED:            'Resource created successfully',
    UPDATED:            'Resource updated successfully',
    DELETED:            'Resource deleted successfully',
    NOT_FOUND:          'Resource not found',
    INTERNAL_ERROR:     'Internal server error',
    VALIDATION_ERROR:   'Validation failed',
    UNAUTHORIZED:       'Unauthorized',
    FORBIDDEN:          'Access denied',
    TOO_MANY_REQUESTS:  'Too many requests, please try again later',
    // Auth-specific
    INVALID_CREDENTIALS:  'Invalid email or password',
    ACCOUNT_INACTIVE:     'Your account is inactive. Please contact support.',
    ACCOUNT_BANNED:       'Your account has been suspended.',
    EMAIL_NOT_VERIFIED:   'Please verify your email before logging in.',
    EMAIL_ALREADY_VERIFIED: 'Email is already verified.',
    EMAIL_SENT:           'If this email exists, a link has been sent.',
    PASSWORD_RESET_SUCCESS: 'Password has been reset successfully.',
    LOGOUT_SUCCESS:       'Logged out successfully.',
    TOKEN_INVALID:        'Token is invalid or has expired.',
    REGISTRATION_SUCCESS: 'Account created. Please verify your email.',
  },

  PAGINATION: {
    DEFAULT_PAGE:  1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT:     100,
  },

  COOKIE: {
    REFRESH_TOKEN_NAME: 'lagaao_rt',
    MAX_AGE_MS:         7 * 24 * 60 * 60 * 1000, // 7 days
  },

  AUTH: {
    BCRYPT_ROUNDS:          12,
    RESET_TOKEN_EXPIRES_MIN: 10,
    VERIFY_TOKEN_EXPIRES_MIN: 60 * 24, // 24h
    MAX_ACTIVE_SESSIONS:    5,
  },
} as const;
