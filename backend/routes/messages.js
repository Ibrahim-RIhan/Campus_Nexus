const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Get chat history with a specific user
router.get('/:userId', authMiddleware, async (req, res) => {
    try {
        const myId = req.user.id;
        const otherId = req.params.userId;
        const [messages] = await pool.query(
            `SELECT * FROM Message 
             WHERE (senderId = ? AND receiverId = ?) 
                OR (senderId = ? AND receiverId = ?) 
             ORDER BY created_at ASC`,
            [myId, otherId, otherId, myId]
        );
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get list of users the current user has chatted with
router.get('/users/contacts', authMiddleware, async (req, res) => {
    try {
        const myId = req.user.id;
        const query = `
            SELECT DISTINCT u.id, u.name, u.role 
            FROM User u
            JOIN Message m ON (m.senderId = u.id OR m.receiverId = u.id)
            WHERE (m.senderId = ? OR m.receiverId = ?) AND u.id != ?
        `;
        const [contacts] = await pool.query(query, [myId, myId, myId]);
        res.json(contacts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
