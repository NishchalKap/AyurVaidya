/**
 * Ayurvaidya - AI-Assisted Clinical Decision Support System
 * 
 * Stage 1: Foundation Backend
 * 
 * This is the main entry point for the Express server.
 * 
 * "Guidance, Not Diagnosis"
 */

// Load environment variables FIRST
import 'dotenv/config';

import express from 'express';
import cors from 'cors';

// Database
import { initializeDatabase, seedDatabase, closeDatabase } from './config/database.js';
import { initSupabase } from './config/supabase.js';
import { initOpenAI } from './services/openaiService.js';

// Routes
import patientRoutes from './routes/patients.js';
import caseRoutes from './routes/cases.js';
import aiRoutes from './routes/ai.js';
import marketingRoutes from './routes/marketing.js';
import publicChatRoutes from './routes/publicChat.js';

// Middleware
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 3000;
const API_VERSION = 'v1';

// ============================================
// INITIALIZE
// ============================================

// Initialize database
try {
    initializeDatabase();
    seedDatabase();
} catch (error) {
    console.error('Failed to initialize database:', error.message);
    process.exit(1);
}

// Initialize external services (non-blocking)
initSupabase();
initOpenAI();

// Create Express app
const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS - allow all origins for development
app.use(cors());

// Serve Static Frontend Files
// Using absolute path to the hackathon directory
const FRONTEND_PATH = 'd:/Nishchal/Coding Projects/Ayurvadiya/hackathon/hackathon';
app.use(express.static(FRONTEND_PATH));

// Parse JSON bodies
app.use(express.json());

// Request logging (simple)
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            service: 'Ayurvaidya CDSS',
            version: '0.1.0',
            stage: 'Stage 1 - Foundation',
            status: 'HEALTHY',
            timestamp: new Date().toISOString(),
            disclaimer: 'Guidance, Not Diagnosis'
        }
    });
});

// API info
app.get(`/api/${API_VERSION}`, (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'Ayurvaidya Clinical Decision Support API',
            version: API_VERSION,
            stage: 'Stage 1 - Foundation (AI Stubs)',
            endpoints: {
                patients: `/api/${API_VERSION}/patients`,
                cases: `/api/${API_VERSION}/cases`,
                ai: `/api/${API_VERSION}/ai`
            },
            documentation: 'See /docs/API.md for full documentation'
        }
    });
});

// Mount routes
app.use(`/api/${API_VERSION}`, marketingRoutes);
app.use(`/api/${API_VERSION}/chat`, publicChatRoutes);
app.use(`/api/${API_VERSION}/patients`, patientRoutes);
app.use(`/api/${API_VERSION}/cases`, caseRoutes);
app.use(`/api/${API_VERSION}/ai`, aiRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// SERVER START
// ============================================

const server = app.listen(PORT, () => {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║   🏥  AYURVAIDYA - Clinical Decision Support System        ║');
    console.log('║                                                            ║');
    console.log('║   Stage 1: Foundation Backend                              ║');
    console.log('║   "Guidance, Not Diagnosis"                                ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log(`   🚀 Server running at: http://localhost:${PORT}`);
    console.log(`   📡 API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
    console.log('   🔧 Mode: AI Stubs (Stage 1)');
    console.log('\n');
    console.log('   Endpoints:');
    console.log(`   • Patients:  http://localhost:${PORT}/api/${API_VERSION}/patients`);
    console.log(`   • Cases:     http://localhost:${PORT}/api/${API_VERSION}/cases`);
    console.log(`   • AI:        http://localhost:${PORT}/api/${API_VERSION}/ai`);
    console.log(`   • Health:    http://localhost:${PORT}/health`);
    console.log('\n');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

function shutdown() {
    console.log('\n🛑 Shutting down server...');

    server.close(() => {
        closeDatabase();
        console.log('👋 Server closed. Goodbye!\n');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('⚠️ Forcing shutdown...');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
