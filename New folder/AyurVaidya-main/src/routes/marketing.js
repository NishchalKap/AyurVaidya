/**
 * Marketing Routes
 * Endpoints for frontend "Discovery" features
 * 
 * NOW INTEGRATED WITH CLINICAL BRIDGE
 */

import { Router } from 'express';
import { getAllDoctors, getDoctorById } from '../models/Doctor.js';
import { createCaseFromBooking, getBridgeStats } from '../services/bridgeService.js';

const router = Router();

// ============================================
// DOCTOR DISCOVERY
// ============================================

/**
 * GET /doctors
 * List all available doctors
 */
router.get('/doctors', (req, res) => {
    const { specialty } = req.query;
    let doctors = getAllDoctors();

    if (specialty && specialty !== 'all') {
        doctors = doctors.filter(d =>
            d.specialty.toLowerCase().includes(specialty.toLowerCase()) ||
            (specialty === 'ayurveda' && d.specialty.includes('Vaidya'))
        );
    }

    res.json({ success: true, data: doctors });
});

/**
 * GET /doctors/:id
 * Get specific doctor details
 */
router.get('/doctors/:id', (req, res) => {
    const doctor = getDoctorById(req.params.id);
    if (!doctor) {
        return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    res.json({ success: true, data: doctor });
});

// ============================================
// BOOKING (WITH BRIDGE)
// ============================================

/**
 * POST /bookings
 * Create an appointment
 * 
 * BRIDGE: Also creates a CaseFile for clinical tracking
 */
router.post('/bookings', async (req, res) => {
    const { doctorId, date, time, type } = req.body;

    if (!doctorId || !date || !time) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }

    const bookingId = `bk_${Date.now()}`;

    const bookingData = {
        id: bookingId,
        status: 'CONFIRMED',
        doctorId,
        date,
        time,
        type: type || 'Video Call'
    };

    // BRIDGE: Create clinical case from booking (async, non-blocking)
    createCaseFromBooking(bookingData).then(caseFile => {
        if (caseFile) {
            console.log(`🌉 Bridge: Created case ${caseFile.id} from booking ${bookingId}`);
        }
    });

    // Return booking confirmation immediately (frontend unchanged)
    res.status(201).json({
        success: true,
        data: bookingData,
        message: 'Booking confirmed successfully'
    });
});

// ============================================
// AUTH (MOCK)
// ============================================

/**
 * POST /auth/login
 * Mock login for frontend modal
 */
router.post('/auth/login', (req, res) => {
    const { email } = req.body;

    res.json({
        success: true,
        data: {
            token: 'mock_jwt_token_12345',
            user: {
                id: 'usr_001',
                name: 'Demo User',
                email: email || 'user@example.com'
            }
        }
    });
});

/**
 * POST /auth/signup
 * Mock signup
 */
router.post('/auth/signup', (req, res) => {
    res.status(201).json({
        success: true,
        data: {
            token: 'mock_jwt_token_new',
            user: {
                id: 'usr_002',
                name: 'New User',
                email: req.body.email
            }
        }
    });
});

// ============================================
// BRIDGE STATS (INTERNAL)
// ============================================

/**
 * GET /bridge/stats
 * Get bridge activity statistics
 */
router.get('/bridge/stats', (req, res) => {
    const stats = getBridgeStats();
    res.json({ success: true, data: stats });
});

export default router;
