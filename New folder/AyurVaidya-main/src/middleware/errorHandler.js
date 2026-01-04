/**
 * Error Handler Middleware
 * Centralized error handling for the API
 */

/**
 * Not found handler (404)
 */
export function notFoundHandler(req, res, next) {
    res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Route not found: ${req.method} ${req.path}`
    });
}

/**
 * Global error handler
 */
export function errorHandler(err, req, res, next) {
    console.error('❌ Error:', err.message);

    // SQLite constraint errors
    if (err.message?.includes('FOREIGN KEY constraint failed')) {
        return res.status(400).json({
            success: false,
            error: 'CONSTRAINT_ERROR',
            message: 'Referenced record does not exist'
        });
    }

    if (err.message?.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
            success: false,
            error: 'DUPLICATE_ERROR',
            message: 'Record already exists'
        });
    }

    // Validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            details: err.errors
        });
    }

    // Default server error
    res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : 'An internal error occurred'
    });
}

export default {
    notFoundHandler,
    errorHandler
};
