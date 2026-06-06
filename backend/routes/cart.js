const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Get cart items
router.get('/', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT c.*, i.title, i.price, i.deposit, u.name as ownerName 
            FROM Cart c 
            JOIN Item i ON c.itemId = i.id 
            JOIN User u ON i.ownerId = u.id
            WHERE c.userId = ?
        `;
        const [items] = await pool.query(query, [req.user.id]);
        res.json(items);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Add to cart
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { itemId, startDate, endDate, totalCost } = req.body;
        const id = randomUUID();
        
        await pool.query(
            'INSERT INTO Cart (id, userId, itemId, startDate, endDate, totalCost) VALUES (?, ?, ?, ?, ?, ?)',
            [id, req.user.id, itemId, startDate, endDate, totalCost]
        );
        res.status(201).json({ message: 'Added to cart' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Remove from cart
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await pool.query('DELETE FROM Cart WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Removed from cart' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Checkout cart (convert all to rentals)
router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [cartItems] = await pool.query('SELECT * FROM Cart WHERE userId = ?', [userId]);
        
        if (cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty' });

        for (const item of cartItems) {
            const rentalId = randomUUID();
            await pool.query(
                'INSERT INTO Rental (id, itemId, renterId, startDate, endDate, totalCost, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [rentalId, item.itemId, userId, item.startDate, item.endDate, item.totalCost, 'REQUESTED']
            );

            // Notify provider
            const [itemData] = await pool.query('SELECT ownerId, title FROM Item WHERE id = ?', [item.itemId]);
            if (itemData.length > 0) {
                await pool.query(
                    'INSERT INTO Notification (id, userId, message) VALUES (?, ?, ?)',
                    [randomUUID(), itemData[0].ownerId, `New rental request for ${itemData[0].title}`]
                );
            }
        }

        // Clear cart
        await pool.query('DELETE FROM Cart WHERE userId = ?', [userId]);

        res.json({ message: 'Checkout successful. Rentals requested.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
