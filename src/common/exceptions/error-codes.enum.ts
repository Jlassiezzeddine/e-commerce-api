/**
 * Error codes for consistent error identification across the API
 * Format: MODULE_CODE (e.g., AUTH_001, PRODUCT_002)
 */
export enum ErrorCode {
  // Auth errors (AUTH_001 - AUTH_099)
  AUTH_001 = 'AUTH_001',
  AUTH_002 = 'AUTH_002',
  AUTH_003 = 'AUTH_003',
  AUTH_004 = 'AUTH_004',
  AUTH_005 = 'AUTH_005',
  AUTH_006 = 'AUTH_006',
  AUTH_007 = 'AUTH_007',
  AUTH_008 = 'AUTH_008',

  // User errors (USER_001 - USER_099)
  USER_001 = 'USER_001',
  USER_002 = 'USER_002',
  USER_003 = 'USER_003',

  // Product errors (PRODUCT_001 - PRODUCT_099)
  PRODUCT_001 = 'PRODUCT_001',
  PRODUCT_002 = 'PRODUCT_002',
  PRODUCT_003 = 'PRODUCT_003',
  PRODUCT_004 = 'PRODUCT_004',

  // Category errors (CATEGORY_001 - CATEGORY_099)
  CATEGORY_001 = 'CATEGORY_001',
  CATEGORY_002 = 'CATEGORY_002',
  CATEGORY_003 = 'CATEGORY_003',

  // Discount errors (DISCOUNT_001 - DISCOUNT_099)
  DISCOUNT_001 = 'DISCOUNT_001',
  DISCOUNT_002 = 'DISCOUNT_002',
  DISCOUNT_003 = 'DISCOUNT_003',
  DISCOUNT_004 = 'DISCOUNT_004',

  // Database errors (DB_001 - DB_099)
  DB_001 = 'DB_001',
  DB_002 = 'DB_002',
  DB_003 = 'DB_003',
  DB_004 = 'DB_004',

  // Validation errors (VAL_001 - VAL_099)
  VAL_001 = 'VAL_001',

  // Generic errors (GEN_001 - GEN_099)
  GEN_001 = 'GEN_001',
}
