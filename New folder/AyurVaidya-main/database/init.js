/**
 * Ayurvaidya Database Initialization Script
 * Run with: npm run db:init
 */

import { initializeDatabase, seedDatabase, closeDatabase } from '../src/config/database.js';

console.log('🏥 Ayurvaidya Database Initialization');
console.log('=====================================\n');

try {
    // Initialize database
    initializeDatabase();

    // Seed with sample data
    seedDatabase();

    console.log('\n✅ Database ready!');
    console.log('   Run "npm run dev" to start the server.\n');

} catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    process.exit(1);
} finally {
    closeDatabase();
}
