const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { rentalId, rating, comment } = req.body;
        
        const [rentals] = await pool.query('SELECT * FROM Rental WHERE id = ?', [rentalId]);
        if (rentals.length === 0 || rentals[0].renterId !== req.user.id || rentals[0].status !== 'COMPLETED') {
            return res.status(400).json({ message: 'Invalid rental for review' });
        }

        const id = randomUUID();
        await pool.query(
            'INSERT INTO Review (id, rentalId, reviewerId, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [id, rentalId, req.user.id, rating, comment]
        );

        res.status(201).json({ message: 'Review submitted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
