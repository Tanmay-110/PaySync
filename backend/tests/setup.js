// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'payment_reconciliation_test';

// Global test timeout
jest.setTimeout(10000);
