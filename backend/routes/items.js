const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Get all items (Catalog page)
router.get('/', async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, condition, sortBy } = req.query;
        let query = 'SELECT * FROM Item WHERE status = "AVAILABLE"';
        const params = [];

        if (search) {
            query += ' AND title LIKE ?';
            params.push(`%${search}%`);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        if (minPrice) {
            query += ' AND price >= ?';
            params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            query += ' AND price <= ?';
            params.push(parseFloat(maxPrice));
        }
        if (condition) {
            query += ' AND `condition` = ?';
            params.push(condition);
        }

        if (sortBy === 'price_asc') {
            query += ' ORDER BY price ASC';
        } else if (sortBy === 'price_desc') {
            query += ' ORDER BY price DESC';
        } else if (sortBy === 'newest') {
            query += ' ORDER BY created_at DESC';
        } else {
            query += ' ORDER BY created_at DESC';
        }

        const [items] = await pool.query(query, params);
        res.json(items);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get user's items (Provider dashboard)
router.get('/my-items', authMiddleware, async (req, res) => {
    try {
        const [items] = await pool.query('SELECT * FROM Item WHERE ownerId = ?', [req.user.id]);
        res.json(items);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Create item (Provider only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'Provider' && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to post items' });
        }

        const { title, category, price, deposit, condition } = req.body;
        const id = randomUUID();

        await pool.query(
            'INSERT INTO Item (id, ownerId, title, category, price, deposit, `condition`) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, req.user.id, title, category, price, deposit, condition]
        );

        res.status(201).json({ id, title, message: 'Item created successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get single item details
router.get('/:id', async (req, res) => {
    try {
        const [items] = await pool.query(`
            SELECT i.*, u.name as ownerName 
            FROM Item i 
            JOIN User u ON i.ownerId = u.id 
            WHERE i.id = ?
        `, [req.params.id]);
        if (items.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(items[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
