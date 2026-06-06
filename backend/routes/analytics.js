const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Total spent by this user (as renter) per month
        const [spendingRaw] = await pool.query(`
            SELECT MONTHNAME(created_at) as month, SUM(totalCost) as total 
            FROM Rental 
            WHERE renterId = ? AND status = 'COMPLETED'
            GROUP BY MONTHNAME(created_at), MONTH(created_at)
            ORDER BY MONTH(created_at)
        `, [userId]);

        const spending = spendingRaw.map(item => ({ ...item, total: parseFloat(item.total) }));

        // Total earned by this user (as provider) per month
        const [earningsRaw] = await pool.query(`
            SELECT MONTHNAME(r.created_at) as month, SUM(r.totalCost) as total 
            FROM Rental r
            JOIN Item i ON r.itemId = i.id
            WHERE i.ownerId = ? AND r.status = 'COMPLETED'
            GROUP BY MONTHNAME(r.created_at), MONTH(r.created_at)
            ORDER BY MONTH(r.created_at)
        `, [userId]);

        const earnings = earningsRaw.map(item => ({ ...item, total: parseFloat(item.total) }));

        res.json({ spending, earnings });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
