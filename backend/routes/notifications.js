const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const [notifications] = await pool.query(
            'SELECT * FROM Notification WHERE userId = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(notifications);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
    try {
        await pool.query('UPDATE Notification SET is_read = TRUE WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
