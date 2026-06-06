const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Request Refund
router.post('/refund', authMiddleware, async (req, res) => {
    try {
        const { rentalId, reason } = req.body;
        const renterId = req.user.id;
        const id = randomUUID();

        // Check if rental is completed
        const [rentals] = await pool.query('SELECT status FROM Rental WHERE id = ? AND renterId = ?', [rentalId, renterId]);
        if (rentals.length === 0 || rentals[0].status !== 'COMPLETED') {
            return res.status(400).json({ message: 'Can only refund completed rentals' });
        }

        await pool.query(
            'INSERT INTO Refund (id, rentalId, renterId, reason) VALUES (?, ?, ?, ?)',
            [id, rentalId, renterId, reason]
        );

        res.status(201).json({ message: 'Refund requested successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Report Listing or User
router.post('/report', authMiddleware, async (req, res) => {
    try {
        const { reportedItemId, reportedUserId, reason } = req.body;
        const reporterId = req.user.id;
        const id = randomUUID();

        await pool.query(
            'INSERT INTO Report (id, reporterId, reportedItemId, reportedUserId, reason) VALUES (?, ?, ?, ?, ?)',
            [id, reporterId, reportedItemId || null, reportedUserId || null, reason]
        );

        res.status(201).json({ message: 'Report submitted for review' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
