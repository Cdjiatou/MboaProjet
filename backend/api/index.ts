/**
 * @file api/index.ts
 * @description Serverless function handler for Vercel
 * 
 * This file exports the Express app as a serverless function
 * compatible with Vercel's serverless architecture.
 */

// Import the Express app from the main index file
import app from '../src/index';

// Export the Express app as a Vercel serverless function
export default app;
