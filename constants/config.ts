// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  TIMEOUT: 30000, // 30 seconds
} as const;

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

// Validation Constants
export const VALIDATION = {
  CAMPAIGN_NAME_MAX_LENGTH: 100,
  EMAIL_SUBJECT_MAX_LENGTH: 200,
  EMAIL_CONTENT_MAX_LENGTH: 10000,
  PASSWORD_MIN_LENGTH: 8,
} as const;

// UI Constants
export const UI = {
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  PAGINATION_LIMIT: 20,
} as const;

// Social Media Platforms
export const SOCIAL_PLATFORMS = {
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
  TIKTOK: 'tiktok',
  TELEGRAM: 'telegram',
} as const;

// Campaign Statuses
export const CAMPAIGN_STATUSES = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;
