const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Get all events
router.get('/', async (req, res) => {
    try {
        const [events] = await pool.query('SELECT * FROM Event ORDER BY date ASC');
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Create Event (Admin/Provider)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, date } = req.body;
        const id = randomUUID();

        await pool.query(
            'INSERT INTO Event (id, title, date, is_verified) VALUES (?, ?, ?, ?)',
            [id, title, date, req.user.role === 'Admin']
        );

        res.status(201).json({ message: 'Event created successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
