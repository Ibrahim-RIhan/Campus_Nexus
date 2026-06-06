const express = require('express');
const router = express.Router();
const pool = require('../db');

// Calculate provider trust score
router.get('/:id/trust-score', async (req, res) => {
    try {
        const providerId = req.params.id;
        
        const [reviews] = await pool.query(`
            SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount
            FROM Review r
            JOIN Rental rn ON r.rentalId = rn.id
            JOIN Item i ON rn.itemId = i.id
            WHERE i.ownerId = ?
        `, [providerId]);
        
        let score = 50; // Base score for new users
        let badge = null;
        let avgRating = reviews[0].avgRating ? parseFloat(reviews[0].avgRating).toFixed(1) : 0;
        let reviewCount = reviews[0].reviewCount || 0;

        if (reviewCount > 0) {
            score = Math.floor(50 + (avgRating * 10));
            if (score > 100) score = 100;
        }

        if (score >= 90 && reviewCount >= 2) {
            badge = "Super Provider 🌟";
        } else if (score >= 80 && reviewCount >= 1) {
            badge = "Trusted Provider 🏅";
        }

        res.json({ score, badge, avgRating, reviewCount });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
