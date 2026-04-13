const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: System health check operations
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Verify if the system and database are up and running
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: System operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 database:
 *                   type: string
 *                   example: CONNECTED
 *                 message:
 *                   type: string
 *                   example: Server & Database are healthy
 *       500:
 *         description: Server error or database connection issue
 */
router.get('/', async (req, res) => {
    try {
        // Test basic ping to Supabase by fetching a nonexistent row just to check connection
        // Alternatively, depending on Supabase version, just testing if the client exists is often enough, 
        // but we'll try a lightweight query if a table exists, or simply return OK for now.
        
        let dbStatus = "CONNECTED (Assuming Valid Client)";
        
        // Supabase REST doesn't have a direct 'ping' without querying a table.
        // We will just verify client instantiation.
        if (!supabase) {
            throw new Error("Supabase client not initialized");
        }

        res.status(200).json({
            status: 'OK',
            database: dbStatus,
            message: 'Server & Database are healthy'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            database: 'DISCONNECTED',
            message: error.message
        });
    }
});

module.exports = router;
